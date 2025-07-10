import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogController } from './log.controller'
import { CaptchaLogService } from './services/captcha-log.service'
import { CaptchaLogEntity } from './entities/captcha-log.entity'
import { LoginLogService } from './services/login-log.service'
import { TaskLogService } from './services/task-log.service'
import { LoginLogEntity } from './entities/login-log.entity'
import { UserModule } from '../user/user.module'

const providers = [CaptchaLogService, LoginLogService, TaskLogService]

@Module({
  imports: [TypeOrmModule.forFeature([CaptchaLogEntity, LoginLogEntity]), UserModule],
  controllers: [LogController],
  providers: [...providers],
  exports: [TypeOrmModule, ...providers]
})
export class LogModule {}
