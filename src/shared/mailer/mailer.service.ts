import { Inject, Injectable } from '@nestjs/common'
import { ISendMailOptions, MailerService as NestMailerService } from '@nestjs-modules/mailer'
import Redis from 'ioredis'
import dayjs from 'dayjs'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { appConfig, AppConfig } from '@/config/app.config'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { randomValue } from '@/utils/index.util'

@Injectable()
export class MailerService {
  constructor(
    @Inject(appConfig.KEY) private appConfig: AppConfig,
    @InjectRedis() private redis: Redis,
    private mailerService: NestMailerService
  ) {}

  async send(
    to: ISendMailOptions['to'],
    subject: string,
    content: string,
    type: 'text' | 'html' = 'text'
  ): Promise<any> {
    return this.mailerService.sendMail({
      to,
      subject,
      [type === 'text' ? 'text' : 'html']: content
    })
  }

  async checkLimit(to: string, ip: string) {
    const LIMIT_TIME = 5

    // ip限制
    const ipLimit = await this.redis.get(`ip:${ip}:send:limit`)
    if (ipLimit) {
      // 请求频率过快，请一分钟后再试
      throw new BusinessException(ErrorEnum.TOO_MANY_REQUESTS)
    }

    // 1分钟最多接收1条
    const limit = await this.redis.get(`captcha:${to}:limit`)
    if (limit) {
      throw new BusinessException(ErrorEnum.TOO_MANY_REQUESTS)
    }

    // 1天一个邮箱最多接收5条
    let limitCountOfDay: string | number = await this.redis.get(`captcha:${to}:limit-day`)
    limitCountOfDay = limitCountOfDay ? Number(limitCountOfDay) : 0
    if (limitCountOfDay > LIMIT_TIME) {
      // 一天最多发送5条验证码
      throw new BusinessException(ErrorEnum.MAXIMUM_FIVE_VERIFICATION_CODES_PER_DAY)
    }

    // 1天一个ip最多发送5条
    let ipLimitCountOfDay: string | number = await this.redis.get(`ip:${ip}:send:limit-day`)
    ipLimitCountOfDay = ipLimitCountOfDay ? Number(ipLimitCountOfDay) : 0
    if (ipLimitCountOfDay > LIMIT_TIME) {
      // 一天最多发送5条验证码
      throw new BusinessException(ErrorEnum.MAXIMUM_FIVE_VERIFICATION_CODES_PER_DAY)
    }
  }

  // 发送带模板的邮件
  async sendVerificationCode(to, code = randomValue(4, '1234567890')) {
    const subject = `[${this.appConfig.name}] 验证码`

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template: './verification-code-zh',
        context: {
          code
        }
      })
    } catch (err) {
      console.log('err', err)
      // 验证码发送失败
      throw new BusinessException(ErrorEnum.VERIFICATION_CODE_SEND_FAILED)
    }

    return {
      to,
      code
    }
  }

  async log(to: string, code: string, ip: string) {
    const getRemainTime = () => {
      const now = dayjs()
      return now.endOf('day').diff(now, 'second')
    }

    // 设置5分钟的过期时间
    await this.redis.set(`captcha:${to}`, code, 'EX', 60 * 5)

    // 1天一个邮箱最多接收5条
    const limitCountOfDay = await this.redis.get(`captcha:${to}:limit-day`)

    // 1天一个ip最多发送5条
    const ipLimitCountOfDay = await this.redis.get(`ip:${ip}:send:limit-day`)

    // ip 1分钟内被限制发送
    await this.redis.set(`ip:${ip}:send:limit`, 1, 'EX', 60)

    // 邮箱 1分钟内被限制收取
    await this.redis.set(`captcha:${to}:limit`, 1, 'EX', 60)

    await this.redis.set(
      `captcha:${to}:send:limit-count-day`,
      limitCountOfDay,
      'EX',
      getRemainTime()
    )

    await this.redis.set(`ip:${ip}:send:limit-count-day`, ipLimitCountOfDay, 'EX', getRemainTime())
  }
}
