import { Controller, Post, Body, Ip, Headers, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { LoginDto, LoginToken, RegisterDto } from './dto/auth.dto'
import { CaptchaService } from './services/captcha.service'
import { Public } from '@/common/decorator/public.decorator'
// import { LocalGuard } from './guards/local.guard'

// 只有当控制器方法尝试访问 req.user 时，才会真正触发 LocalStrategy 的 validate 方法

@ApiTags('Auth - 认证模块')
// @UseGuards(LocalGuard)
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private captchaService: CaptchaService
  ) {}

  @Post('login')
  @ApiOperation({ summary: '登录' })
  @ApiResult({ type: LoginToken })
  // 待优化 to-do @Request() req 避免重复验证
  async login(@Body() params: LoginDto, @Ip() ip: string, @Headers('user-agent') ua: string) {
    await this.captchaService.checkImgCaptcha(params.captchaId, params.verifyCode)
    const token = await this.authService.login(params.username, params.password, ip, ua)
    return { token }
  }

  @Post('register')
  @ApiOperation({ summary: '注册' })
  async register(@Body() dto: RegisterDto): Promise<void> {
    // await this.userService.register(dto)
  }
}
