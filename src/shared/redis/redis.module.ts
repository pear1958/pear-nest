import { Global, Module, Provider } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { RedisOptions } from 'ioredis'
import { CacheModule } from '@nestjs/cache-manager'
import { redisStore } from 'cache-manager-ioredis-yet'
import { RedisModule as NestRedisModule, RedisService } from '@liaoliaots/nestjs-redis'
import { ConfigKeyPaths } from '@/config'
import { RedisConfig } from '@/config/redis.config'
import { REDIS_CLIENT } from '@/common/decorators/inject-redis.decorator'
import { CacheService } from './cache.service'
import { REDIS_PUBSUB } from '@/constant/redis.constant'
import { RedisPubSub } from './pubsub'
import { RedisPubSubService } from './pubsub.service'

const providers: Provider[] = [
  CacheService,
  {
    inject: [ConfigService],
    provide: REDIS_PUBSUB,
    useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
      const redisOptions: RedisOptions = configService.get<RedisConfig>('redis')
      return new RedisPubSub(redisOptions)
    }
  },
  RedisPubSubService,
  {
    inject: [RedisService],
    provide: REDIS_CLIENT,
    useFactory: (redisService: RedisService) => {
      return redisService.getOrThrow()
    }
  }
]

/**
 * 集成 Redis 缓存和发布订阅功能
 */
@Global()
@Module({
  imports: [
    // 配置 NestJS 缓存管理器, 使用 Redis 作为存储
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        const redisOptions: RedisOptions = configService.get<RedisConfig>('redis')
        return {
          isGlobal: true, // 全局缓存
          store: redisStore, // 使用 Redis 存储
          isCacheableValue: () => true, // 所有值都可缓存
          ...redisOptions
        }
      },
      inject: [ConfigService]
    }),
    // 配置 Redis 模块
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        readyLog: true, // 启用连接成功日志
        config: configService.get<RedisConfig>('redis')
      }),
      inject: [ConfigService]
    })
  ],
  providers,
  exports: [...providers, CacheModule]
})
export class RedisModule {}
