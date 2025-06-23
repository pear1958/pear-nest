import { RedisKeys } from '@/constant/cache.constant'

// 生成验证码 redis key
export function genCaptchaImgKey(val: string | number) {
  return `${RedisKeys.CAPTCHA_IMG_PREFIX}${String(val)}` as const
}
