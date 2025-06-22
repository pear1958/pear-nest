import { appRegToken, appConfig, type AppConfig } from './app'
import { swaggerRegToken, swaggerConfig, type SwaggerConfig } from './swagger'
import { dbRegToken, type DatabaseConfig, databaseConfig } from './database'
import { RedisConfig, redisConfig, redisRegToken } from './redis'

export interface AllConfigType {
  [appRegToken]: AppConfig
  [swaggerRegToken]: SwaggerConfig
  [dbRegToken]: DatabaseConfig
  [redisRegToken]: RedisConfig
}

export type ConfigKeyPaths = RecordNamePaths<AllConfigType>

export default {
  appConfig,
  swaggerConfig,
  databaseConfig,
  redisConfig
}
