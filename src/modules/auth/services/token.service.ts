import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import Redis from 'ioredis'
import dayjs from 'dayjs'
import { InjectRedis } from '@/common/decorators/inject-redis.decorator'
import { SecurityConfig, securityConfig } from '@/config/security.config'
import { AccessTokenEntity } from '../entities/access-token.entity'
import { UserEntity } from '@/modules/user/entities/user.entity'
import { RefreshTokenEntity } from '../entities/refresh-token.entity'
import { generateUUID } from '@/utils/index.util'

@Injectable()
export class TokenService {
  constructor(
    @InjectRedis() private redis: Redis,
    @Inject(securityConfig.KEY) private securityConfig: SecurityConfig,
    private jwtService: JwtService
  ) {}

  async generateAccessToken(uid: number, roles: string[] = []) {
    const payload: AuthUser = {
      uid,
      // Password Version
      // 标识用户密码版本, 用于检测密码是否变更
      // 用户修改密码时, 服务器将pv递增（如从 1→2）
      // 旧 JWT 中的pv=1与服务器当前pv=2不匹配, 强制用户重新登录
      pv: 1,
      roles // 避免频繁查库
    }

    const jwtSign = await this.jwtService.signAsync(payload)

    // 生成accessToken
    const accessToken = new AccessTokenEntity()
    accessToken.value = jwtSign
    accessToken.user = { id: uid } as UserEntity
    accessToken.expired_at = dayjs().add(this.securityConfig.jwtExprire, 'second').toDate()
    await accessToken.save()

    // 生成refreshToken
    const refreshToken = await this.generateRefreshToken(accessToken, dayjs())

    return {
      accessToken: jwtSign,
      refreshToken
    }
  }

  /**
   * 生成新的RefreshToken并存入数据库
   * @param accessToken
   * @param now
   */
  async generateRefreshToken(accessToken: AccessTokenEntity, now: dayjs.Dayjs): Promise<string> {
    const refreshTokenPayload = {
      uuid: generateUUID()
    }

    const refreshTokenSign = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: this.securityConfig.refreshSecret
    })

    const refreshToken = new RefreshTokenEntity()
    refreshToken.value = refreshTokenSign
    refreshToken.expired_at = now.add(this.securityConfig.refreshExpire, 'second').toDate()
    refreshToken.accessToken = accessToken
    await refreshToken.save()

    return refreshTokenSign
  }
}
