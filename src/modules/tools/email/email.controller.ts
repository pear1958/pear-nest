import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { EmailSendDto } from './email.dto'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { MailerService } from '@/shared/mailer/mailer.service'

@ApiTags('System - 邮箱模块')
@ApiSecurityAuth()
@Controller('email')
export class EmailController {
  constructor(private emailService: MailerService) {}

  @ApiOperation({ summary: '发送邮件' })
  @Post('send')
  async send(@Body() dto: EmailSendDto): Promise<void> {
    const { to, subject, content } = dto
    await this.emailService.send(to, subject, content, 'html')
  }
}
