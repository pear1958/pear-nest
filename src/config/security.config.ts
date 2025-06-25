import { ConfigType, registerAs } from '@nestjs/config'
import { env, envNumber } from '@/utils/env.util'

export const securityRegToken = 'security'

export const securityConfig = registerAs(securityRegToken, () => ({
  jwtSecret: env('JWT_SECRET'),
  jwtExprire: envNumber('JWT_EXPIRE'),
  refreshSecret: env('REFRESH_TOKEN_SECRET'),
  refreshExpire: envNumber('REFRESH_TOKEN_EXPIRE')
}))

export type SecurityConfig = ConfigType<typeof securityConfig>
