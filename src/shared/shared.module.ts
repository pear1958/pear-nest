import { Global, Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { HttpModule } from '@nestjs/axios'
import { ScheduleModule } from '@nestjs/schedule'
import { LoggerModule } from './logger/logger.module'
import { RedisModule } from './redis/redis.module'
import { MailerModule } from './mailer/mailer.module'
import { HelperModule } from './helper/helper.module'

// 标记为全局模块, 其它模块无需导入即可使用其服务
// 全局模块的注册是在应用启动时进行的，并不要求必须在 app.module.ts 中导入
// 不过，通常建议在 app.module.ts 中导入全局模块, 提高代码的可读性
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
    ScheduleModule.forRoot(),
    RedisModule,
    MailerModule,
    HttpModule,
    HelperModule
  ],
  exports: [RedisModule, MailerModule, HttpModule, HelperModule]
})
export class SharedModule {}
