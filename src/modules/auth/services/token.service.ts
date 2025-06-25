import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import Redis from 'ioredis'
import dayjs from 'dayjs'
import { InjectRedis } from '@/common/decorators/inject-redis.decorator'
import { SecurityConfig, securityConfig } from '@/config/security.config'
import { AccessTokenEntity } from '../entities/access-token.entity'
import { UserEntity } from '@/modules/user/entities/user.entity'

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
    accessToken.user = { id: uid } as UserEntity // to-do
    accessToken.expired_at = dayjs().add(this.securityConfig.jwtExprire, 'second').toDate()

    return {
      accessToken: jwtSign,
      refresh_token: 222
    }
  }
}
