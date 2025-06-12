import { registerAs, type ConfigType } from '@nestjs/config'
import { env, envBoolean } from '@/utils/env'

export const swagger = 'swagger'

export const swaggerConfig = registerAs(swagger, () => ({
  enable: envBoolean('SWAGGER_ENABLE'),
  serverUrl: env('APP_BASE_URL'),
  path: env('SWAGGER_PATH')
}))

export type SwaggerConfig = ConfigType<typeof swaggerConfig>
