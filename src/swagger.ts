import { Logger } from '@nestjs/common'

export function setupSwagger() {
  return () => {
    const logger = new Logger('SwaggerModule')
    logger.log(`Swagger UI: ${111}`)
    logger.log(`Swagger JSON: ${222}/json`)
  }
}
