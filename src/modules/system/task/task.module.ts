import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bull'
import { TaskService } from './task.service'
import { TaskController } from './task.controller'
import { TaskEntity } from './task.entity'
import { SYS_TASK_QUEUE_NAME, SYS_TASK_QUEUE_PREFIX } from './task.constant'
import { ConfigKeyPaths } from '@/config'
import { RedisConfig, redisRegToken } from '@/config/redis.config'
import { LogModule } from '../log/log.module'
import { TaskConsumer } from './task.processor'

const providers = [TaskService, TaskConsumer]

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity]),
    BullModule.registerQueueAsync({
      name: SYS_TASK_QUEUE_NAME,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        redis: configService.get<RedisConfig>(redisRegToken),
        prefix: SYS_TASK_QUEUE_PREFIX
      })
    }),
    LogModule
  ],
  controllers: [TaskController],
  providers,
  exports: [TypeOrmModule, ...providers]
})
export class TaskModule {}
