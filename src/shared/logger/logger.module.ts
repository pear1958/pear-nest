import { Module } from '@nestjs/common'
import { LoggerService } from './logger.service'

@Module({})
export class LoggerModule {
  // 静态方法 配置一个动态模块一次，并在多个地方重用该配置
  static forRoot() {
    return {
      global: true,
      module: LoggerModule,
      providers: [LoggerService],
      exports: [LoggerService]
    }
  }
}
