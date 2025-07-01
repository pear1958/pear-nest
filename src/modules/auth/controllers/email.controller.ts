import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { Public } from '@/common/decorator/public.decorator'
import { MailerService } from '@/shared/mailer/mailer.service'
import { SendEmailCodeDto } from '../dto/captcha.dto'
import { Ip } from '@/common/decorator/http.decorator'

@ApiTags('Auth - 认证模块')
@UseGuards(ThrottlerGuard)
@Controller('auth/email')
export class EmailController {
  constructor(private mailerService: MailerService) {}

  @Post('send')
  @ApiOperation({ summary: '发送邮箱验证码' })
  @Public()
  @Throttle({ default: { limit: 2, ttl: 600000 } }) // 10分钟
  async sendEmailCode(@Body() dto: SendEmailCodeDto, @Ip() ip: string): Promise<void> {
    const { email } = dto
    // 检查限制
    await this.mailerService.checkLimit(email, ip)
    // 发生验证码
    const { code } = await this.mailerService.sendVerificationCode(email)
    // 记录限制
    await this.mailerService.log(email, code, ip)
  }
}
