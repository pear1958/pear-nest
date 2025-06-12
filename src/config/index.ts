import { app, appConfig, type AppConfig } from './app'
import { swagger, swaggerConfig, type SwaggerConfig } from './swagger'

export interface AllConfigType {
  [app]: AppConfig
  [swagger]: SwaggerConfig
}

export type ConfigKeyPaths = RecordNamePaths<AllConfigType>

export default {
  appConfig,
  swaggerConfig
}
