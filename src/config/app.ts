import { env, envNumber } from '@/utils/env'
import { type ConfigType, registerAs } from '@nestjs/config'

export const app = 'app'

export const appConfig = registerAs(app, () => ({
  name: env('APP_NAME'),
  port: envNumber('APP_PORT'),
  baseUrl: env('APP_BASE_URL'),
  prefix: env('APP_PREFIX')
}))

export type AppConfig = ConfigType<typeof appConfig>
