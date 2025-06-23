import { Inject, Injectable } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Emitter } from '@socket.io/redis-emitter'
import { RedisIoAdapterKey } from '@/common/adapters/socket'
import { API_CACHE_PREFIX } from '@/common/constant/cache'
import { getRedisKey } from '@/utils/redis'

export type TCacheResult<T> = Promise<T | undefined>

@Injectable()
export class CacheService {
  private cache!: Cache

  private ioRedis!: Redis

  constructor(@Inject(CACHE_MANAGER) cache: Cache) {
    this.cache = cache
  }

  private get redisClient(): Redis {
    // @ts-ignore
    return this.cache.store.client
  }

  public getClient() {
    return this.redisClient
  }

  public get<T>(key: string): TCacheResult<T> {
    return this.cache.get(key)
  }

  public set(key: string, value: any, milliseconds: number) {
    return this.cache.set(key, value, milliseconds)
  }

  private _emitter: Emitter

  public get emitter(): Emitter {
    if (this._emitter) return this._emitter

    this._emitter = new Emitter(this.redisClient, {
      key: RedisIoAdapterKey
    })

    return this._emitter
  }

  public async cleanCache() {
    const redis = this.getClient()
    const keys: string[] = await redis.keys(`${API_CACHE_PREFIX}*`)
    await Promise.all(keys.map(key => redis.del(key)))
  }

  public async cleanAllRedisKey() {
    const redis = this.getClient()
    const keys: string[] = await redis.keys(getRedisKey('*'))
    await Promise.all(keys.map(key => redis.del(key)))
  }
}
