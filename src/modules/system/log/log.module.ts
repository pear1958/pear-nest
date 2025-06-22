import { Module } from '@nestjs/common'
import { LogController } from './log.controller'
import { CaptchaLogService } from './services/captcha-log.service'

@Module({
  controllers: [LogController],
  providers: [CaptchaLogService]
})
export class LogModule {}
