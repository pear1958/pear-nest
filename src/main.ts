import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { HttpStatus, Logger, UnprocessableEntityException, ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { setupSwagger } from './swagger'
import { ConfigKeyPaths } from './config'
import { AppConfig } from './config/app'
import { LoggingInterceptor } from './common/interceptor/logging'
import { isDev } from './utils/env'
import { LoggerService } from './shared/logger/logger.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService<ConfigKeyPaths>)

  const { port, prefix } = configService.get<AppConfig>('app')!

  // 允许跨域
  app.enableCors({
    origin: '*',
    credentials: true, // 跨域请求是否允许携带凭证 如Cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })

  app.setGlobalPrefix(prefix)

  // 本地环境开启 接口处理 日志打印
  if (isDev) {
    app.useGlobalInterceptors(new LoggingInterceptor())
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // 根据 dto 中定义的类型信息, 自动转换请求数据的类型, 即使没有显式使用 @Type() 装饰器
      transformOptions: { enableImplicitConversion: true },
      // 只有在 dto 中使用 class-validator 装饰器 如 @IsString()、@IsNumber() 等 明确标记的属性才会被保留
      // 未标记的属性会被自动过滤掉, 不会进入应用程序
      whitelist: true,
      // 当验证失败时, 返回 HTTP 422 状态码(不可处理的实体), 而不是默认的 400 错误
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      // 遇到第一个验证错误时立即停止验证, 不再继续检查其他约束条件, 这可以提高性能
      stopAtFirstError: true,
      exceptionFactory: errors =>
        new UnprocessableEntityException(
          errors.map(e => {
            const rule = Object.keys(e.constraints!)[0]
            const msg = e.constraints![rule]
            return msg
          })[0]
        )
    })
  )

  const printSwaggerLog = setupSwagger(app, configService)

  await app.listen(port, '0.0.0.0', async () => {
    app.useLogger(app.get(LoggerService))
    printSwaggerLog?.()

    const url = await app.getUrl()
    const logger = new Logger('NestApplication')
    logger.log(`Server running on ${url}`)
  })
}

bootstrap()
