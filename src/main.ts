import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe
} from '@nestjs/common'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import path from 'node:path'
import { useContainer } from 'class-validator'
import { AppModule } from './app.module'
import { setupSwagger } from './swagger'
import { ConfigKeyPaths } from './config'
import { AppConfig } from './config/app'
import { LoggingInterceptor } from './common/interceptor/logging'
import { isDev } from './utils/env'
import { LoggerService } from './shared/logger/logger.service'
import { fastifyApp } from './common/adapters/fastify'

async function bootstrap() {
  // 使用 fastify 服务器
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyApp, {
    bufferLogs: true,
    snapshot: true
  })

  const configService = app.get(ConfigService<ConfigKeyPaths>)

  const { port, prefix } = configService.get<AppConfig>('app')!

  // class-validator 的 DTO 类中注入 nest 容器的依赖 (用于自定义验证器)
  // 当 class-validator 无法从 NestJS 容器解析依赖时, 回退到自身的容器, 避免抛出错误
  useContainer(app.select(AppModule), { fallbackOnErrors: true })

  // 允许跨域
  app.enableCors({
    origin: '*',
    credentials: true, // 跨域请求是否允许携带凭证 如Cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })

  app.setGlobalPrefix(prefix)
  app.useStaticAssets({ root: path.join(__dirname, '..', 'public') })

  // 启用优雅关闭
  !isDev && app.enableShutdownHooks()

  // 本地环境开启 接口处理 日志打印
  if (isDev) {
    app.useGlobalInterceptors(new LoggingInterceptor())
  }

  app.useGlobalPipes(
    // 验证管道的作用是对进入应用程序的 http 请求数据进行验证和转换, 确保数据符合预期的格式和规则
    new ValidationPipe({
      transform: true,
      // 根据 dto 中定义的类型信息, 自动转换请求数据的类型, 即使没有显式使用 @Type() 装饰器
      transformOptions: { enableImplicitConversion: true },
      // 只有在 dto 中使用 class-validator 装饰器 如 @IsString()、@IsNumber() 等 明确标记的属性才会被保留
      // 未标记的属性会被自动过滤掉, 不会进入应用程序
      whitelist: true,
      // 当验证失败时, 返回 http 422 状态码(不可处理的实体), 而不是默认的 400 错误
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      // 遇到第一个验证错误时立即停止验证, 不再继续检查其他约束条件, 这可以提高性能
      stopAtFirstError: true,
      // 只返回第一个错误, 让客户端一次只处理一个问题
      // { statusCode: 422, message: ['xxx', 'xxx'], error: "Unprocessable Entity" } -> message: 'xxx'
      // errors: 一个字段违反多个规则 || 多个字段违反规则
      exceptionFactory: errors => {
        const msgList = errors.map((item: ValidationError) => {
          // 找到第一个验证规则名称
          // constraints: { isNotEmpty: "should not be empty" }
          // constraints 默认只有一个属性, 多次违法规则会被放到多个Error中
          const rule = Object.keys(item.constraints!)[0]
          // 获取该规则对应的错误消息
          return item.constraints![rule]
        })
        const msg = msgList[0] // 只取第一个错误消息
        return new UnprocessableEntityException(msg)
      }
    })
  )

  const printSwaggerLog = setupSwagger(app, configService)

  // Fastify 需显式指定 host
  await app.listen(port, '0.0.0.0', async () => {
    app.useLogger(app.get(LoggerService))
    printSwaggerLog?.()

    const url = await app.getUrl()
    const logger = new Logger('NestApplication')
    logger.log(`Server running on ${url}`)
  })
}

bootstrap()
