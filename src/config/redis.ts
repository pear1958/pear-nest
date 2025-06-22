import { ConfigType, registerAs } from '@nestjs/config'
import { env, envNumber } from '@/utils/env'

export const redisRegToken = 'redis'

export const redisConfig = registerAs(redisRegToken, () => ({
  host: env('REDIS_HOST', '127.0.0.1'),
  port: envNumber('REDIS_PORT', 6379),
  password: env('REDIS_PASSWORD'),
  db: envNumber('REDIS_DB') // 选择第一个数据库
}))

export type RedisConfig = ConfigType<typeof redisConfig>
