import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { CaptchaService } from './services/captcha.service'
import { TokenService } from './services/token.service'

const providers = [AuthService, CaptchaService, TokenService]

@Module({
  controllers: [AuthController],
  providers: [...providers],
  exports: [...providers]
})
export class AuthModule {}
