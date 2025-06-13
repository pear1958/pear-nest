import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { setupSwagger } from './swagger'
import { ConfigKeyPaths } from './config'
import { AppConfig } from './config/app'
import { LoggingInterceptor } from './common/interceptor/logging'
import { isDev } from './utils/env'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService<ConfigKeyPaths>)

  const { port, prefix } = configService.get<AppConfig>('app')!

  app.setGlobalPrefix(prefix)

  // 本地环境开启日志打印
  if (isDev) app.useGlobalInterceptors(new LoggingInterceptor())

  const printSwaggerLog = setupSwagger(app, configService)

  await app.listen(port, '0.0.0.0', async () => {
    printSwaggerLog?.()
  })
}

bootstrap()
