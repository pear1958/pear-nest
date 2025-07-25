import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { isEmpty } from 'lodash'
import { UserService } from '../system/user/user.service'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { md5 } from '@/utils/crypto.util'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import {
  genAuthPVKey,
  genAuthPermKey,
  genAuthTokenKey,
  genTokenBlacklistKey
} from '@/helper/genRedisKey'
import { SecurityConfig, securityConfig } from '@/config/security.config'
import { TokenService } from './services/token.service'
import { LoginLogService } from '../system/log/services/login-log.service'
import { AppConfig, appConfig } from '@/config/app.config'
import { MenuService } from '../system/menu/menu.service'
import { RoleService } from '../system/role/role.service'

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private loginLogService: LoginLogService,
    private menuService: MenuService,
    private roleService: RoleService,
    @InjectRedis() private readonly redis: Redis,
    @Inject(securityConfig.KEY) private securityConfig: SecurityConfig,
    @Inject(appConfig.KEY) private appConfig: AppConfig
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

    const roleIds = await this.roleService.getRoleIdsByUser(user.id)
    const roles = await this.roleService.getRoleValues(roleIds)

    const token = await this.tokenService.generateAccessToken(user.id, roles)

    await this.redis.set(
      genAuthTokenKey(user.id),
      token.accessToken,
      'EX', // 过期时间单位: 秒(EX = Expire in Seconds)
      this.securityConfig.jwtExprire // 1天
    )

    // 设置密码版本号 当密码修改时，版本号+1
    await this.redis.set(genAuthPVKey(user.id), 1)

    await this.loginLogService.create(user.id, ip, ua)

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

  /**
   * 清除登录状态信息
   */
  async clearLoginStatus(user: AuthUser, accessToken: string): Promise<void> {
    const expire = user.exp
      ? (user.exp - Date.now() / 1000).toFixed(0)
      : this.securityConfig.jwtExprire

    await this.redis.set(genTokenBlacklistKey(accessToken), accessToken, 'EX', expire)

    if (this.appConfig.multiDeviceLogin) {
      // 每个端的token不一样, 删除一个token即可
      await this.tokenService.removeAccessToken(accessToken)
    } else {
      await this.userService.forbidden(user.uid, accessToken)
    }
  }

  // 获取用户缓存的权限
  async getPermissionsCache(uid: number): Promise<string[]> {
    const permissionString = await this.redis.get(genAuthPermKey(uid))
    return permissionString ? JSON.parse(permissionString) : []
  }

  /**
   * 获取权限列表
   */
  async getPermissions(uid: number): Promise<string[]> {
    return this.menuService.getPermissions(uid)
  }

  /**
   * 获取菜单列表
   */
  async getMenus(uid: number) {
    return this.menuService.getMenus(uid)
  }
}
