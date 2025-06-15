import { Global, Module } from '@nestjs/common'
import { LoggerModule } from './logger/logger.module'

// 标记为全局模块
@Global()
@Module({
  imports: [
    LoggerModule.forRoot() // 只需导入一次
  ],
  exports: []
})
export class SharedModule {}
