import { type INestApplication, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigKeyPaths } from './config'
import { SwaggerConfig } from './config/swagger'
import { env } from './utils/env'
import { AppConfig } from './config/app'
import { HttpResponse, Tree } from './common/model/response'
import { API_SECURITY_AUTH } from './common/decorators/swagger'

export function setupSwagger(app: INestApplication, configService: ConfigService<ConfigKeyPaths>) {
  const { enable, serverUrl, path } = configService.get<SwaggerConfig>('swagger')!
  const { name, prefix } = configService.get<AppConfig>('app')!
  if (!enable) return

  const config = new DocumentBuilder()
    .setTitle(name)
    .setDescription(`${name}接口文档`)
    .setVersion(env('SWAGGER_VERSION'))
    .addServer(`${serverUrl}/${prefix}`, 'Base URL')
    // 必须输入 token 才能访问
    // .addSecurity(API_SECURITY_AUTH, {
    //   description: '请输入令牌 ( Enter the token )',
    //   type: 'http',
    //   scheme: 'bearer',
    //   bearerFormat: 'JWT'
    // })
    .build()

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      ignoreGlobalPrefix: true, // 忽略 /api 前缀
      extraModels: [HttpResponse, Tree]
    })

  // eg: 访问: http://localhost:3000/api-docs
  // 下载地址: http://localhost:3000/api-json
  SwaggerModule.setup(path, app, documentFactory)

  const swaggerPath = serverUrl + '/' + path

  return () => {
    const logger = new Logger('SwaggerModule')
    logger.log(`Swagger UI 地址: ${swaggerPath}`)
    logger.log(`Swagger JSON 地址: ${swaggerPath}/json`)
  }
}
