import { appRegToken, appConfig, type AppConfig } from './app'
import { swaggerRegToken, swaggerConfig, type SwaggerConfig } from './swagger'
import { dbRegToken, type DatabaseConfig, databaseConfig } from './database'

export interface AllConfigType {
  [appRegToken]: AppConfig
  [swaggerRegToken]: SwaggerConfig
  [dbRegToken]: DatabaseConfig
}

export type ConfigKeyPaths = RecordNamePaths<AllConfigType>

export default {
  appConfig,
  swaggerConfig,
  databaseConfig
}
