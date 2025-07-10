import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit
} from '@nestjs/common'
import { ModuleRef, Reflector } from '@nestjs/core'
import { UnknownElementException } from '@nestjs/core/errors/exceptions/unknown-element.exception'
import { InjectQueue } from '@nestjs/bull'
import { JobInformation, Queue } from 'bull'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'
import Redis from 'ioredis'
import { isEmpty, isNil } from 'lodash'
import { TaskEntity } from './task.entity'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { MISSION_DECORATOR_KEY } from '@/modules/task/mission.decorator'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { TaskDto, TaskQueryDto, TaskUpdateDto } from './task.dto'
import { SYS_TASK_QUEUE_NAME, SYS_TASK_QUEUE_PREFIX, TaskStatus, TaskType } from './task.constant'
import { Pagination } from '@/helper/paginate/pagination'
import { paginate } from '@/helper/paginate'

@Injectable()
export class TaskService implements OnModuleInit {
  private logger = new Logger(TaskService.name)

  constructor(
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
    // 从 NestJS 的依赖注入容器中获取名为 SYS_TASK_QUEUE_NAME 的队列实例
    @InjectQueue(SYS_TASK_QUEUE_NAME) private taskQueue: Queue,
    private moduleRef: ModuleRef,
    private reflector: Reflector,
    @InjectRedis() private redis: Redis
  ) {}

  async onModuleInit() {
    await this.initTask()
  }

  /**
   * 初始化任务，系统启动前调用
   */
  async initTask(): Promise<void> {
    // 定义一个初始化锁的键，用于防止重复初始化
    const initKey = `${SYS_TASK_QUEUE_PREFIX}:init`

    // 防止重复初始化
    const result = await this.redis
      // 执行多个命令，确保操作的原子性
      .multi()
      // setnx 方法用于设置一个键值对，如果键不存在则设置成功并返回 1，否则返回 0
      // 只有当键不存在时才进行设置操作
      .setnx(initKey, new Date().getTime())
      // 设置 initKey 的过期时间为 30 分钟（60 * 30 秒），防止锁一直存在
      .expire(initKey, 60 * 30)
      // 执行上述多个 Redis 命令
      .exec()

    // 判断 setnx 操作的返回值，如果为 0 表示键已经存在，即已经有其他进程在初始化
    if (result[0][1] === 0) {
      // 存在锁则直接跳过防止重复初始化
      this.logger.log('Init task is lock', TaskService.name)
      return
    }

    // 获取任务队列中处于各种状态的任务
    const jobs = await this.taskQueue.getJobs([
      'active', // 正在执行的任务
      'delayed', // 延迟执行的任务
      'failed',
      'paused',
      'waiting',
      'completed'
    ])
    // 遍历获取到的任务列表，并将每个任务从队列中移除
    jobs.forEach(j => j.remove())

    // 查找所有需要运行的任务
    const tasks = await this.taskRepository.findBy({ status: TaskStatus.Activited })
    if (tasks?.length > 0) {
      for (const t of tasks) await this.start(t)
    }
    // 启动后释放锁
    // 删除 Redis 中的 initKey，释放初始化锁
    await this.redis.del(initKey)
  }

  /**
   * 检测service是否有注解定义
   */
  async checkHasMissionMeta(nameOrInstance: string | unknown, exec: string): Promise<void | never> {
    try {
      let service: any
      if (typeof nameOrInstance === 'string') {
        service = await this.moduleRef.get(nameOrInstance, { strict: false })
      } else {
        service = nameOrInstance
      }

      // 所执行的任务不存在
      if (!service || !(exec in service)) {
        throw new NotFoundException('任务不存在')
      }

      // 检测是否有 @Mission() 注解
      const hasMission = this.reflector.get<boolean>(MISSION_DECORATOR_KEY, service.constructor)
      if (!hasMission) {
        // 不安全的任务，确保执行的加入@Mission注解
        throw new BusinessException(ErrorEnum.INSECURE_MISSION)
      }
    } catch (err) {
      if (err instanceof UnknownElementException) {
        // 任务不存在
        throw new NotFoundException('任务不存在')
      } else {
        // 其余错误则不处理，继续抛出
        throw err
      }
    }
  }

  async create(dto: TaskDto): Promise<void> {
    const result = await this.taskRepository.save(dto)
    const task = await this.info(result.id)

    if (result.status === TaskStatus.Activited) {
      await this.start(task)
    }

    if (result.status === TaskStatus.Disabled) {
      await this.stop(task)
    }
  }

  /**
   * task info
   */
  async info(id: number): Promise<TaskEntity> {
    const task = this.taskRepository.createQueryBuilder('task').where({ id }).getOne()
    if (!task) throw new NotFoundException('Task Not Found')
    return task
  }

  /**
   * 启动任务
   */
  async start(task: TaskEntity): Promise<void> {
    if (!task) {
      throw new BadRequestException('Task is Empty')
    }

    // 先停掉之前存在的任务
    await this.stop(task)

    let repeat: any

    if (task.type === TaskType.Interval) {
      // 间隔 Repeat every millis (cron setting cannot be used together with this setting.)
      repeat = {
        every: task.every
      }
    } else {
      // cron
      repeat = {
        cron: task.cron
      }
      if (task.startTime) repeat.startDate = task.startTime
      if (task.endTime) repeat.endDate = task.endTime
      if (task.limit > 0) repeat.limit = task.limit // 间隔时间

      // 添加任务到队列
      // 添加后，bull 会将任务存储到 Redis 中，并由消费者（Worker）按照配置的规则异步执行该任务
      const job = await this.taskQueue.add(
        // 任务的唯一标识 - 处理该任务的服务名称 - 任务执行所需的参数数据
        { id: task.id, service: task.service, args: task.data },
        {
          // 任务在队列中的唯一 ID
          jobId: task.id,
          // 任务成功完成后自动从队列中移除，节省 Redis 存储空间
          removeOnComplete: true,
          // 任务失败后也自动移除
          removeOnFail: true,
          // 用于配置任务的重复执行规则
          repeat
        }
      )
      // 任务的配置选项(第二个参数的副本)
      if (job?.opts) {
        await this.taskRepository.update(task.id, {
          jobOpts: JSON.stringify(job.opts.repeat),
          status: TaskStatus.Activited
        })
      } else {
        // 从队列中删除任务
        await job?.remove()
        await this.taskRepository.update(task.id, {
          status: TaskStatus.Disabled
        })
        throw new BadRequestException('Task Start failed')
      }
    }
  }

  /**
   * 停止任务
   */
  async stop(task: TaskEntity): Promise<void> {
    if (!task) {
      throw new BadRequestException('Task is Empty')
    }

    const exist = await this.existJob(task.id.toString())

    // 该任务 在队列里 不存在
    if (!exist) {
      await this.taskRepository.update(task.id, {
        status: TaskStatus.Disabled
      })
      return
    }

    // 该任务 在队列里 存在
    const jobs = await this.taskQueue.getJobs([
      'active',
      'delayed',
      'failed',
      'paused',
      'waiting',
      'completed'
    ])
    jobs
      .filter(j => j.data.id === task.id)
      .forEach(async j => {
        // 移除队列中当前存在的单个任务实例
        await j.remove()
      })
    // 彻底移除重复执行的任务配置，防止队列继续创建新的任务实例
    await this.taskQueue.removeRepeatable(JSON.parse(task.jobOpts))

    await this.taskRepository.update(task.id, { status: TaskStatus.Disabled })
  }

  /**
   * 查看队列中任务是否存在
   */
  async existJob(jobId: string): Promise<boolean> {
    // https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#queueremoverepeatablebykey
    // 返回可重复作业配置数组
    const jobs = await this.taskQueue.getRepeatableJobs()
    const ids = jobs.map((_: JobInformation) => _.id)
    return ids.includes(jobId)
  }

  async update(id: number, dto: TaskUpdateDto): Promise<void> {
    await this.taskRepository.update(id, dto)
    const task = await this.info(id)
    if (task.status === TaskStatus.Disabled) {
      await this.stop(task)
    }
    if (task.status === TaskStatus.Activited) {
      await this.start(task)
    }
  }

  async list({
    page,
    pageSize,
    name,
    service,
    type,
    status
  }: TaskQueryDto): Promise<Pagination<TaskEntity>> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where({
        ...(name ? { name: Like(`%${name}%`) } : null),
        ...(service ? { service: Like(`%${service}%`) } : null),
        ...(type ? { type } : null),
        ...(!isNil(status) ? { status } : null)
      })
      .orderBy('task.id', 'ASC')

    return paginate(queryBuilder, { page, pageSize })
  }

  async delete(task: TaskEntity): Promise<void> {
    if (!task) throw new BadRequestException('Task is Empty')
    await this.stop(task)
    await this.taskRepository.delete(task.id)
  }

  /**
   * 手动执行一次
   */
  async once(task: TaskEntity): Promise<void | never> {
    if (task) {
      await this.taskQueue.add(
        { id: task.id, service: task.service, args: task.data },
        { jobId: task.id, removeOnComplete: true, removeOnFail: true }
      )
    } else {
      throw new BadRequestException('Task is Empty')
    }
  }

  /**
   * 根据serviceName调用service，例如 LogService.clearReqLog
   */
  async callService(name: string, args: string): Promise<void> {
    if (!name) return

    const [serviceName, methodName] = name.split('.')
    if (!methodName) {
      throw new BadRequestException('serviceName define BadRequestException')
    }

    const service = await this.moduleRef.get(serviceName, {
      strict: false
    })

    // 安全注解检查
    await this.checkHasMissionMeta(service, methodName)

    if (isEmpty(args)) {
      await service[methodName]()
    } else {
      // 参数安全判断
      const parseArgs = this.safeParse(args)

      if (Array.isArray(parseArgs)) {
        // 数组形式则自动扩展成方法参数回掉
        await service[methodName](...parseArgs)
      } else {
        await service[methodName](parseArgs)
      }
    }
  }

  safeParse(args: string): unknown | string {
    try {
      return JSON.parse(args)
    } catch (e) {
      return args
    }
  }

  /**
   * 更新是否已经完成，完成则移除该任务并修改状态
   */
  async updateTaskCompleteStatus(tid: number): Promise<void> {
    const jobs = await this.taskQueue.getRepeatableJobs()
    const task = await this.taskRepository.findOneBy({ id: tid })
    // 如果下次执行时间小于当前时间，则表示已经执行完成。
    for (const job of jobs) {
      const currentTime = new Date().getTime()
      if (job.id === tid.toString() && job.next < currentTime) {
        // 如果下次执行时间小于当前时间，则表示已经执行完成。
        await this.stop(task)
        break
      }
    }
  }
}
