import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { setupSwagger } from './swagger'
import { ConfigKeyPaths } from './config'
import { envNumber } from './utils/env'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService<ConfigKeyPaths>)

  const printSwaggerLog = setupSwagger(app, configService)

  await app.listen(envNumber(process.env.APP_PORT as string), '0.0.0.0', async () => {
    printSwaggerLog?.()
  })
}

bootstrap()
