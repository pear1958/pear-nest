import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { isEmpty } from 'lodash-es'
import { UserService } from '../user/user.service'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { md5 } from '@/utils/crypto.util'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { genAuthPVKey, genAuthTokenKey } from '@/helper/genRedisKey'
import { SecurityConfig, securityConfig } from '@/config/security.config'
import { TokenService } from './services/token.service'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    @InjectRedis() private readonly redis: Redis,
    @Inject(securityConfig.KEY) private securityConfig: SecurityConfig
  ) {}

  /**
   * 获取登录JWT
   * 返回null则账号密码有误, 不存在该用户
   */
  async login(username: string, password: string, ip: string, ua: string) {
    const user = await this.userService.findUserByUserName(username)

    // 用户名不存在
    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)
    }

    const comparePassword = md5(`${password}${user.psalt}`)

    // 密码错误
    if (user.password !== comparePassword) {
      throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)
    }

    // to-do roles
    const token = await this.tokenService.generateAccessToken(user.id, [])

    await this.redis.set(
      genAuthTokenKey(user.id),
      token.accessToken,
      'EX', // 过期时间单位: 秒(EX = Expire in Seconds)
      this.securityConfig.jwtExprire // 1天
    )

    // 设置密码版本号 当密码修改时，版本号+1
    await this.redis.set(genAuthPVKey(user.id), 1)

    console.log('token', token)

    // to-do 添加登录日志

    return token.accessToken
  }

  async validateUser(credential: string, password: string): Promise<any> {
    const user = await this.userService.findUserByUserName(credential)

    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)
    }

    if (user.password !== md5(`${password}${user.psalt}`)) {
      throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)
    }

    // 省略密码字段
    if (user) {
      const { password, ...result } = user
      return result
    }

    return null
  }

  async getPasswordVersionByUid(uid: number): Promise<string> {
    return this.redis.get(genAuthPVKey(uid))
  }

  async getTokenByUid(uid: number): Promise<string> {
    return this.redis.get(genAuthTokenKey(uid))
  }
}
