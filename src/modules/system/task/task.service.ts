import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ModuleRef, Reflector } from '@nestjs/core'
import { UnknownElementException } from '@nestjs/core/errors/exceptions/unknown-element.exception'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Redis from 'ioredis'
import { TaskEntity } from './task.entity'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { MISSION_DECORATOR_KEY } from '@/modules/task/mission.decorator'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { TaskDto } from './task.dto'
import { TaskStatus } from './task.constant'

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name)

  constructor(
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
    // @InjectQueue(SYS_TASK_QUEUE_NAME) private taskQueue: Queue,
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
    // const task = await this.info(result.id)

    if (result.status === TaskStatus.Disabled) {
      // await this.stop(task)
    }

    if (result.status === TaskStatus.Activited) {
      // await this.start(task)
    }
  }
}
