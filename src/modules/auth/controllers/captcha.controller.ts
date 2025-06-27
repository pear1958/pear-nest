import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Controller, Get, Query } from '@nestjs/common'
import Redis from 'ioredis'
import { isEmpty } from 'lodash-es'
import * as svgCaptcha from 'svg-captcha'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { ImageCaptchaDto } from '../dto/captcha.dto'
import { generateUUID } from '@/utils/index.util'
import { genCaptchaImgKey } from '@/helper/genRedisKey'
import { ImageCaptcha } from '../dto/auth.dto'
import { Public } from '@/common/decorator/public.decorator'
import { ApiResult } from '@/common/decorator/api-result.decorator'

@ApiTags('Captcha - 验证码模块')
@Controller('auth/captcha')
export class CaptchaController {
  constructor(@InjectRedis() private redis: Redis) {}

  @Get('img')
  @ApiOperation({ summary: '获取登录图片验证码' })
  @ApiResult({ type: ImageCaptcha })
  @Public()
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
