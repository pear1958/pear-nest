import { type INestApplication, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigKeyPaths } from './config'
import { SwaggerConfig } from './config/swagger'

export function setupSwagger(app: INestApplication, configService: ConfigService<ConfigKeyPaths>) {
  const { enable, serverUrl, path } = configService.get<SwaggerConfig>('swagger')!
  if (!enable) return

  const swaggerPath = serverUrl + '/' + path

  const config = new DocumentBuilder()
    .setTitle('Pear-Admin')
    .setDescription('Pear-Admin接口文档')
    .setVersion('1.0.0')
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, config)

  // 访问: http://localhost:3000/api
  // 下载地址: http://localhost:3000/api-json
  SwaggerModule.setup('api', app, documentFactory)

  return () => {
    const logger = new Logger('SwaggerModule')
    logger.log(`Swagger UI: ${swaggerPath}`)
    logger.log(`Swagger JSON: ${swaggerPath}/json`)
  }
}
