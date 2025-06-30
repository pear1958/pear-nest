import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogController } from './log.controller'
import { CaptchaLogService } from './services/captcha-log.service'
import { CaptchaLogEntity } from './entities/captcha-log.entity'
import { LoginLogService } from './services/login-log.service'
import { LoginLogEntity } from './entities/login-log.entity'

const providers = [CaptchaLogService, LoginLogService]

@Module({
  imports: [TypeOrmModule.forFeature([CaptchaLogEntity, LoginLogEntity])],
  controllers: [LogController],
  providers: [...providers],
  exports: [TypeOrmModule, ...providers]
})
export class LogModule {}
