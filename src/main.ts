import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { setupSwagger } from './swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const printSwaggerLog = setupSwagger()

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0', async () => {
    printSwaggerLog()
  })
}

bootstrap()
