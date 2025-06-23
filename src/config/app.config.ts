import { env, envNumber } from '@/utils/env.util'
import { type ConfigType, registerAs } from '@nestjs/config'

export const appRegToken = 'app'

export const appConfig = registerAs(appRegToken, () => ({
  name: env('APP_NAME'),
  port: envNumber('APP_PORT'),
  baseUrl: env('APP_BASE_URL'),
  prefix: env('APP_PREFIX'),
  logger: {
    level: env('LOGGER_LEVEL'),
    maxFiles: envNumber('LOGGER_MAX_FILES')
  }
}))

export type AppConfig = ConfigType<typeof appConfig>
