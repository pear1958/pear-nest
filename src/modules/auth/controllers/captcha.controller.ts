import { ApiTags } from '@nestjs/swagger'
import { Controller, Query } from '@nestjs/common'
import Redis from 'ioredis'
import { isEmpty } from 'lodash-es'
import * as svgCaptcha from 'svg-captcha'
import { InjectRedis } from '@/common/decorators/inject-redis.decorator'
import { ImageCaptchaDto } from '../dto/captcha.dto'
import { ImageCaptcha } from '../model/auth.model'
import { generateUUID } from '@/utils/index.util'
import { genCaptchaImgKey } from '@/helper/genRedisKey'

@ApiTags('Captcha - 验证码模块')
@Controller('auth/captcha')
export class CaptchaController {
  constructor(@InjectRedis() private redis: Redis) {}

  async captchaByImg(@Query() dto: ImageCaptchaDto): Promise<ImageCaptcha> {
    const { width, height } = dto

    const svg = svgCaptcha.create({
      size: 4, // 验证码长度
      color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
      noise: 4, // 干扰线条的数量
      width: isEmpty(width) ? 100 : width,
      height: isEmpty(height) ? 50 : height,
      charPreset: '1234567890' // random character preset
    })

    const result = {
      img: `data:image/svg+xml;base64,${Buffer.from(svg.data).toString('base64')}`,
      id: generateUUID()
    }
    // 5分钟过期时间
    await this.redis.set(genCaptchaImgKey(result.id), svg.text, 'EX', 60 * 5)
    return result
  }
}
