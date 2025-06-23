import { REDIS_PUBSUB } from '@/constant/redis.constant'
import { Inject, Injectable } from '@nestjs/common'
import { RedisPubSub } from './pubsub'

@Injectable()
export class RedisPubSubService {
  constructor(@Inject(REDIS_PUBSUB) private readonly redisPubSub: RedisPubSub) {}

  public async publish(event: string, data: any) {
    return this.redisPubSub.publish(event, data)
  }

  public async subscribe(event: string, callback: (data: any) => void) {
    return this.redisPubSub.subscribe(event, callback)
  }

  public async unsubscribe(event: string, callback: (data: any) => void) {
    return this.redisPubSub.unsubscribe(event, callback)
  }
}
