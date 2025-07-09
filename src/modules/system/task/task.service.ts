import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ModuleRef, Reflector } from '@nestjs/core'
import { UnknownElementException } from '@nestjs/core/errors/exceptions/unknown-element.exception'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Redis from 'ioredis'
import { TaskEntity } from './task.entity'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { MISSION_DECORATOR_KEY } from '@/modules/task/mission.decorator'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { TaskDto } from './task.dto'
import { SYS_TASK_QUEUE_NAME, TaskStatus, TaskType } from './task.constant'

@Injectable()
export class TaskService {
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
  }
}
