import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { isEmpty } from 'lodash-es'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { CaptchaLogService } from '@/modules/system/log/services/captcha-log.service'
import { genCaptchaImgKey } from '@/helper/genRedisKey'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'

@Injectable()
export class CaptchaService {
  constructor(
    @InjectRedis() private redis: Redis,
    private captchaLogService: CaptchaLogService
  ) {}

  /**
   * 校验图片验证码
   */
  async checkImgCaptcha(id: string, code: string): Promise<void> {
    const key = genCaptchaImgKey(id)
    const correctCode = await this.redis.get(key)

    if (isEmpty(correctCode) || code.toLowerCase() !== correctCode.toLowerCase()) {
      throw new BusinessException(ErrorEnum.INVALID_VERIFICATION_CODE)
    }

    // 校验成功后移除验证码
    await this.redis.del(key)
  }

  async log(account: string, code: string, provider: 'sms' | 'email', uid?: number): Promise<void> {
    await this.captchaLogService.create(account, code, provider, uid)
  }
}
