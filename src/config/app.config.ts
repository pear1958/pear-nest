import { env, envBoolean, envNumber } from '@/utils/env.util'
import { type ConfigType, registerAs } from '@nestjs/config'

export const appRegToken = 'app'

const prefix = env('APP_PREFIX', 'api')

export const appConfig = registerAs(appRegToken, () => ({
  name: env('APP_NAME'),
  port: envNumber('APP_PORT'),
  baseUrl: env('APP_BASE_URL'),
  prefix,
  // 是否允许多端登录
  multiDeviceLogin: envBoolean('MULTI_DEVICE_LOGIN', true),
  logger: {
    level: env('LOGGER_LEVEL'),
    maxFiles: envNumber('LOGGER_MAX_FILES')
  }
}))

export type AppConfig = ConfigType<typeof appConfig>

export const RouterWhiteList: string[] = [
  `${prefix ? '/' : ''}${prefix}/auth/captcha/img`,
  `${prefix ? '/' : ''}${prefix}/auth/login`
]
