import { Global, Module, Provider } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { RedisOptions } from 'ioredis'
import { CacheModule } from '@nestjs/cache-manager'
import { redisStore } from 'cache-manager-ioredis-yet'
import { RedisModule as NestRedisModule, RedisService } from '@liaoliaots/nestjs-redis'
import { ConfigKeyPaths } from '@/config'
import { RedisConfig } from '@/config/redis.config'
import { REDIS_CLIENT } from '@/common/decorator/inject-redis.decorator'
import { CacheService } from './cache.service'
import { REDIS_PUBSUB } from '@/constant/redis.constant'
import { RedisPubSub } from './pubsub'
import { RedisPubSubService } from './pubsub.service'

const providers: Provider[] = [
  // 自定义缓存服务
  CacheService,
  // Redis发布订阅服务提供者  供下面 inject
  {
    inject: [ConfigService],
    provide: REDIS_PUBSUB,
    useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
      const redisOptions: RedisOptions = configService.get<RedisConfig>('redis')
      // 创建并返回Redis发布订阅实例
      return new RedisPubSub(redisOptions)
    }
  },
  // 发布订阅服务
  RedisPubSubService,
  // Redis客户端提供者
  {
    inject: [RedisService],
    provide: REDIS_CLIENT,
    useFactory: (redisService: RedisService) => {
      // 从Redis服务获取默认客户端实例
      return redisService.getOrThrow()
    }
  }
]

/**
 * 集成 Redis 缓存和发布订阅功能
 */
// @Global()
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
  // 导出提供者和CacheModule, 使其他模块可以使用
  exports: [...providers, CacheModule]
})
export class RedisModule {}
