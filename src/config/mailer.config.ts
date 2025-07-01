import { ConfigType, registerAs } from '@nestjs/config'
import { env, envNumber } from '@/utils/env.util'

export const mailerRegToken = 'mailer'

export const mailerConfig = registerAs(mailerRegToken, () => ({
  host: env('SMTP_HOST'), // SMTP 服务器地址
  port: envNumber('SMTP_PORT'), // SMTP 服务器端口
  ignoreTLS: true, // 忽略 TLS 加密。设为 true 时，即使服务器支持 TLS 也不会使用
  secure: true, // 是否使用安全连接（SSL/TLS）。设为 false 表示使用普通连接
  // 认证信息，用于登录 SMTP 服务器
  auth: {
    user: env('SMTP_USER'),
    pass: env('SMTP_PASS')
  }
}))

export type MailerConfig = ConfigType<typeof mailerConfig>
