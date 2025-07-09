import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import Redis from 'ioredis'
import dayjs from 'dayjs'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { SecurityConfig, securityConfig } from '@/config/security.config'
import { AccessTokenEntity } from '../entities/access-token.entity'
import { UserEntity } from '@/modules/system/user/user.entity'
import { RefreshTokenEntity } from '../entities/refresh-token.entity'
import { generateUUID } from '@/utils/index.util'
import { genOnlineUserKey } from '@/helper/genRedisKey'
import { RoleService } from '@/modules/system/role/role.service'

@Injectable()
export class TokenService {
  constructor(
    @InjectRedis() private redis: Redis,
    @Inject(securityConfig.KEY) private securityConfig: SecurityConfig,
    private jwtService: JwtService,
    private roleService: RoleService
  ) {}

  /**
   * 生成新的RefreshToken并存入数据库
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
   * 验证Token是否正确, 如果正确则返回所属用户对象
   */
  async verifyAccessToken(token: string): Promise<AuthUser> {
    return this.jwtService.verifyAsync(token)
  }

  /**
   * 检查accessToken是否存在，并且是否处于有效期内
   */
  async checkAccessToken(value: string) {
    let isValid = false
    try {
      await this.verifyAccessToken(value)
      const res = await AccessTokenEntity.findOne({
        where: { value },
        relations: ['user', 'refreshToken'],
        cache: true
      })
      isValid = Boolean(res)
    } catch (err) {
      // xxxxxxxx
    }

    return isValid
  }

  /**
   * 移除AccessToken且自动移除关联的RefreshToken
   */
  async removeAccessToken(value: string) {
    const accessToken = await AccessTokenEntity.findOne({
      where: { value }
    })

    if (accessToken) {
      // 删除该在线的用户
      this.redis.del(genOnlineUserKey(accessToken.id))
      await accessToken.remove()
    }
  }

  /**
   * 根据accessToken刷新AccessToken与RefreshToken
   */
  async refreshToken(accessToken: AccessTokenEntity) {
    const { user, refreshToken } = accessToken
    if (!refreshToken) return null

    const now = dayjs()
    // 判断refreshToken是否过期
    if (now.isAfter(refreshToken.expired_at)) return null

    const roleIds = await this.roleService.getRoleIdsByUser(user.id)
    const roleValues = await this.roleService.getRoleValues(roleIds)

    // 如果没过期则生成新的access_token和refresh_token
    const token = await this.generateAccessToken(user.id, roleValues)

    await accessToken.remove()

    return token
  }

  // --------------------- 未用到 -----------------------
  generateJwtSign(payload: any) {
    const jwtSign = this.jwtService.sign(payload)
    return jwtSign
  }

  /**
   * 移除RefreshToken
   */
  async removeRefreshToken(value: string) {
    const refreshToken = await RefreshTokenEntity.findOne({
      where: { value },
      relations: ['accessToken']
    })
    if (!refreshToken) return
    if (refreshToken.accessToken) {
      this.redis.del(genOnlineUserKey(refreshToken.accessToken.id))
    }
    await refreshToken.accessToken.remove()
    await refreshToken.remove()
  }
}
