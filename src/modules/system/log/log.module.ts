import { Module } from '@nestjs/common'
import { LogController } from './log.controller'
import { CaptchaLogService } from './services/captcha-log.service'

const providers = [CaptchaLogService]

@Module({
  controllers: [LogController],
  providers: [...providers],
  exports: [...providers]
})
export class LogModule {}
