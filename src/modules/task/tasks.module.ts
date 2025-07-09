import { DynamicModule, ExistingProvider, Module } from '@nestjs/common'

/**
 * 所有需要执行的定时任务都需要在这里注册
 */
@Module({})
export class TasksModule {}
