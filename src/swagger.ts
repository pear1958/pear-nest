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
  const { name, prefix } = configService.get<AppConfig>('app')!
  const { enable, serverUrl, path } = configService.get<SwaggerConfig>('swagger')!

  if (!enable) return

  const swaggerPath = serverUrl + '/' + path

  const desc = `
  🔷 **Base URL**: \`${serverUrl}/${prefix}\` <br>
  🧾 **Swagger JSON**: [查看文档 JSON](${swaggerPath}/json) <br>
  📌 [pear-admin](https://github.com/pear1958/pear-react-admin) 后台管理系统 API 文档
  `

  const config = new DocumentBuilder()
    .setTitle(name)
    .setDescription(desc)
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

  // eg: http://localhost:3000/api-docs
  SwaggerModule.setup(path, app, documentFactory, {
    swaggerOptions: {
      // 刷新页面后，之前输入的认证信息不会丢失
      persistAuthorization: true
    },
    // 指定 Swagger 文档的 JSON 数据接口地址, 默认为${path}-json
    jsonDocumentUrl: `/${path}/json`
  })

  return () => {
    const logger = new Logger('SwaggerModule')
    logger.log(`Swagger UI 地址: ${swaggerPath}`)
    logger.log(`Swagger JSON 地址: ${swaggerPath}/json`)
  }
}
