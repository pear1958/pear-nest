import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { setupSwagger } from './swagger'
import { ConfigKeyPaths } from './config'
import { AppConfig } from './config/app'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService<ConfigKeyPaths>)

  const printSwaggerLog = setupSwagger(app, configService)

  const { port } = configService.get<AppConfig>('app')!

  await app.listen(port, '0.0.0.0', async () => {
    printSwaggerLog?.()
  })
}

bootstrap()
