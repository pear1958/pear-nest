import { registerAs, type ConfigType } from '@nestjs/config'
import { env, envBoolean } from '@/utils/env.util'

export const swaggerRegToken = 'swagger'

export const swaggerConfig = registerAs(swaggerRegToken, () => ({
  enable: envBoolean('SWAGGER_ENABLE'),
  serverUrl: env('APP_BASE_URL'),
  path: env('SWAGGER_PATH')
}))

export type SwaggerConfig = ConfigType<typeof swaggerConfig>
