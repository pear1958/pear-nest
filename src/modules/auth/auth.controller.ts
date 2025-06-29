import { Controller, Post, Body, Ip, Headers } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { LoginDto, LoginToken } from './dto/auth.dto'
import { CaptchaService } from './services/captcha.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private captchaService: CaptchaService
  ) {}

  @Post('login')
  @ApiOperation({ summary: '登录' })
  @ApiResult({ type: LoginToken })
  async login(@Body() params: LoginDto, @Ip() ip: string, @Headers('user-agent') ua: string) {
    await this.captchaService.checkImgCaptcha(params.captchaId, params.verifyCode)
    const token = await this.authService.login(params.username, params.password, ip, ua)
    return { token }
  }
}
