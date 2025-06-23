import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { InjectRedis } from '@/common/decorators/inject-redis.decorator'
import { CaptchaLogService } from '@/modules/system/log/services/captcha-log.service'

@Injectable()
export class CaptchaService {
  constructor(
    @InjectRedis() private redis: Redis,
    private captchaLogService: CaptchaLogService
  ) {}
}
