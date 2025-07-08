import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { UserService } from '../user/user.service'
import { AuthService } from '@/modules/auth/auth.service'
import { TokenService } from '@/modules/auth/services/token.service'
import { OnlineUserInfo } from './online.model'
import { AccessTokenEntity } from '@/modules/auth/entities/access-token.entity'
import { genOnlineUserKey } from '@/helper/genRedisKey'

@Injectable()
export class OnlineService {
  constructor(
    @InjectRedis() private redis: Redis,
    private readonly userService: UserService,
    private authService: AuthService,
    private tokenService: TokenService
  ) {}

  async addOnlineUser(value: string, ip: string, ua: string) {
    const row = await AccessTokenEntity.findOne({
      where: { value },
      relations: {
        user: {
          dept: true
        }
      },
      cache: true
    })
    if (!row) return
  }

  /**
   * 在线用户列表
   * value: 访问令牌的值
   */
  async list(value: string): Promise<OnlineUserInfo[]> {
    // 1. 根据传入的访问令牌值查找对应的 AccessTokenEntity 实体
    const row = await AccessTokenEntity.findOne({
      where: { value },
      relations: ['user'], // 同时加载关联的用户信息
      cache: true // 启用查询缓存，提高查询性能，避免重复查询相同的数据
    })

    // 2. 获取所有在线用户的 Redis 键
    const keys = await this.redis.keys(genOnlineUserKey('*'))

    // 3. 批量获取多个键的值
    const users = await this.redis.mget(keys)

    const rootUserId = await this.userService.findRootUserId()

    return users
      .map(user => {
        const item = JSON.parse(user) as OnlineUserInfo
        item.isCurrent = item.tokenId === row?.id
        item.disable = item.isCurrent || item.uid === rootUserId
        return item
      })
      .sort((a, b) => (a.time > b.time ? -1 : 1))
  }

  /**
   * 下线当前用户
   */
  async kickUser(tokenId: string, user: AuthUser): Promise<void> {
    // xxxxxxx
  }
}
