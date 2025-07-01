import { Global, Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from './logger/logger.module'
import { RedisModule } from './redis/redis.module'
import { MailerModule } from './mailer/mailer.module'

// 标记为全局模块 app.module.ts 中导入以后, 其它模块无需导入即可使用其服务
@Global()
@Module({
  imports: [
    LoggerModule.forRoot(), // 只需导入一次
    ThrottlerModule.forRoot([
      {
        limit: 20, // 不超过 20 次调用
        ttl: 60000 // 1分钟
      }
    ]),
    RedisModule,
    MailerModule
  ],
  exports: [RedisModule, MailerModule]
})
export class SharedModule {}
