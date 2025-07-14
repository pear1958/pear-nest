import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { UAParser } from 'ua-parser-js'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { UserService } from '../user/user.service'
import { AuthService } from '@/modules/auth/auth.service'
import { TokenService } from '@/modules/auth/services/token.service'
import { OnlineUserInfo } from './online.model'
import { AccessTokenEntity } from '@/modules/auth/entities/access-token.entity'
import { genOnlineUserKey } from '@/helper/genRedisKey'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { getIpAddress } from '@/utils/ip.util'
import { SseService } from '@/sse/sse.service'
import { throttle } from 'lodash'

@Injectable()
export class OnlineService {
  constructor(
    @InjectRedis() private redis: Redis,
    private readonly userService: UserService,
    private authService: AuthService,
    private tokenService: TokenService,
    private sseService: SseService
  ) {}

  /**
   * 在线用户数量变动时，通知前端实时更新在线用户数量或列表, 3 秒内最多推送一次，避免频繁触发
   */
  updateOnlineUserCount = throttle(async () => {
    const keys = await this.redis.keys(genOnlineUserKey('*'))
    this.sseService.sendToAllUser({ type: 'updateOnlineUserCount', data: keys.length })
  }, 3000)

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
    const user = await this.tokenService.verifyAccessToken(value)
    // 向零取整 类似 Math.floor
    // 还有多少秒过期
    const exp = ~~(user.exp - Date.now() / 1000)
    const parser = new UAParser()
    const uaResult = parser.setUA(ua).getResult()
    const address = await getIpAddress(ip)

    const result: OnlineUserInfo = {
      ip,
      address,
      tokenId: row.id,
      uid: row.user.id,
      deptName: row.user.dept?.name ?? '',
      os: `${`${uaResult.os.name ?? ''} `}${uaResult.os.version}`,
      browser: `${`${uaResult.browser.name ?? ''} `}${uaResult.browser.version}`,
      username: row.user.username,
      time: row.created_at.toString()
    }

    await this.redis.set(
      genOnlineUserKey(row.id),
      JSON.stringify(result),
      'EX',
      30 * 24 * 60 * 60 * 1000
    ) // exp

    this.updateOnlineUserCount()
  }

  async removeOnlineUser(value: string) {
    const token = await AccessTokenEntity.findOne({
      where: { value },
      relations: ['user'],
      cache: true
    })
    await this.redis.del(genOnlineUserKey(token?.id))
    this.updateOnlineUserCount()
  }

  // 移除所有在线用户
  // async clearOnlineUser() {
  //   const keys = await this.redis.keys(genOnlineUserKey('*'))
  //   await this.redis.del(keys)
  // }

  /**
   * 在线用户列表
   * value: 当前登录用户的token
   */
  async list(value: string): Promise<OnlineUserInfo[]> {
    // 1. 查找 AccessTokenEntity 实体
    const row = await AccessTokenEntity.findOne({
      where: { value },
      relations: ['user'], // 同时加载关联的用户信息
      cache: true // 启用查询缓存，提高查询性能，避免重复查询相同的数据
    })

    const keys = await this.redis.keys(genOnlineUserKey('*'))

    // 获取所有在线用户
    const users = await this.redis.mget(keys)

    const rootUserId = await this.userService.findRootUserId()

    // access_token 表的id, 并不是用户直接对应的token
    const tokenId = row?.id

    return (
      users
        .map(user => {
          const item = JSON.parse(user) as OnlineUserInfo
          // 是否为 当前登录的用户
          item.isCurrent = item.tokenId === tokenId
          // 当前登录的用户 & 管理员 不能显示 禁用按钮
          item.disable = item.isCurrent || item.uid === rootUserId
          return item
        })
        // 时间大的排前面
        .sort((a, b) => (a.time > b.time ? -1 : 1))
    )
  }

  /**
   * 下线当前用户
   * tokenId: access_token 表的id, 并不是用户直接对应的token
   */
  async kickUser(tokenId: string, user: AuthUser): Promise<void> {
    const row = await AccessTokenEntity.findOne({
      where: { id: tokenId },
      relations: ['user'],
      cache: true
    })
    if (!row) return
    const kickId = row.user.id
    const rootUserId = await this.userService.findRootUserId()
    // 无法下线 管理员 和 当前登录用户
    if (kickId === rootUserId || kickId === user.uid) {
      // 不允许下线该用户
      throw new BusinessException(ErrorEnum.NOT_ALLOWED_TO_LOGOUT_USER)
    }
    const token = row.value
    // 通过 token 查 UserEntity
    const kickUser = await this.tokenService.verifyAccessToken(token)
    // 清除登录状态信息
    await this.authService.clearLoginStatus(kickUser, token)
  }
}
