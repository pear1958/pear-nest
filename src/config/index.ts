import { appRegToken, appConfig, type AppConfig } from './app.config'
import { swaggerRegToken, swaggerConfig, type SwaggerConfig } from './swagger.config'
import { dbRegToken, type DatabaseConfig, databaseConfig } from './database.config'
import { RedisConfig, redisConfig, redisRegToken } from './redis.config'
import { securityConfig, SecurityConfig, securityRegToken } from './security.config'
import { mailerConfig, MailerConfig, mailerRegToken } from './mailer.config'
import { OssConfig, ossConfig, ossRegToken } from './oss.config'

export interface AllConfigType {
  [appRegToken]: AppConfig
  [swaggerRegToken]: SwaggerConfig
  [dbRegToken]: DatabaseConfig
  [redisRegToken]: RedisConfig
  [securityRegToken]: SecurityConfig
  [mailerRegToken]: MailerConfig,
  [ossRegToken]: OssConfig,
}

export type ConfigKeyPaths = RecordNamePaths<AllConfigType>

export default {
  appConfig,
  swaggerConfig,
  databaseConfig,
  redisConfig,
  securityConfig,
  mailerConfig,
  ossConfig
}
