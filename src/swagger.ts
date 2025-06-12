import { type INestApplication, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigKeyPaths } from './config'
import { SwaggerConfig } from './config/swagger'
import { env } from './utils/env'
import { AppConfig } from './config/app'

export function setupSwagger(app: INestApplication, configService: ConfigService<ConfigKeyPaths>) {
  const { enable, serverUrl, path } = configService.get<SwaggerConfig>('swagger')!
  const { name, prefix } = configService.get<AppConfig>('app')!
  if (!enable) return

  const config = new DocumentBuilder()
    .setTitle(name)
    .setDescription(`${name}接口文档`)
    .setVersion(env('SWAGGER_VERSION'))
    .addServer(`${serverUrl}/${prefix}`, 'Base URL')
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, config)

  // 访问: http://localhost:3000/api
  // 下载地址: http://localhost:3000/api-json
  SwaggerModule.setup(path, app, documentFactory)

  const swaggerPath = serverUrl + '/' + path

  return () => {
    const logger = new Logger('SwaggerModule')
    logger.log(`Swagger UI: ${swaggerPath}`)
    logger.log(`Swagger JSON: ${swaggerPath}/json`)
  }
}
