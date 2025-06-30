import { ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { ExtractJwt } from 'passport-jwt'
import Redis from 'ioredis'
import { FastifyRequest } from 'fastify'
import { isEmpty, isNil } from 'lodash-es'
import { AuthStrategy, PUBLIC_KEY } from '@/constant/auth.constant'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { AppConfig, appConfig, RouterWhiteList } from '@/config/app.config'
import { AuthService } from '../auth.service'
import { TokenService } from '../services/token.service'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { genTokenBlacklistKey } from '@/helper/genRedisKey'

/** @type {import('fastify').RequestGenericInterface} */
interface RequestType {
  Params: {
    uid?: string
  }
  Querystring: {
    token?: string
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard(AuthStrategy.JWT) {
  jwtFromRequestFn = ExtractJwt.fromAuthHeaderAsBearerToken()

  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private tokenService: TokenService,
    @InjectRedis() private readonly redis: Redis,
    @Inject(appConfig.KEY) private appConfig: AppConfig
  ) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    // 是否添加了 @Public 装饰器
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    const request = context.switchToHttp().getRequest<FastifyRequest<RequestType>>()

    // 不需要 token 验证的接口
    if (RouterWhiteList.includes(request.routeOptions.url)) {
      return true
    }

    const token = this.jwtFromRequestFn(request)

    // 检查 token 是否在黑名单中
    if (await this.redis.get(genTokenBlacklistKey(token))) {
      throw new BusinessException(ErrorEnum.INVALID_LOGIN)
    }

    request.accessToken = token

    let result: any = false

    try {
      // 父类的验证仅针对 Token 的 格式合法性 和 签名有效性
      // 不涉及业务层的验证（如 Token 是否被手动拉黑、用户权限是否变更等）
      result = await super.canActivate(context)
    } catch (err) {
      // 如果路由是公共路由, 即使认证失败也允许访问
      // 需要后置判断 这样携带了 token 的用户就能够解析到 request.user
      if (isPublic) return true

      if (isEmpty(token)) throw new UnauthorizedException('未登录')

      // 在 handleRequest 中 user 为 null 时会抛出 UnauthorizedException
      if (err instanceof UnauthorizedException) {
        throw new BusinessException(ErrorEnum.INVALID_LOGIN)
      }

      // 判断 token 是否有效且存在(并且是否处于有效期内), 如果不存在则认证失败
      const isValid = isNil(token) ? undefined : await this.tokenService.checkAccessToken(token!)

      if (!isValid) throw new BusinessException(ErrorEnum.INVALID_LOGIN)
    }

    const pv = await this.authService.getPasswordVersionByUid(request.user.uid)
    if (pv !== `${request.user.pv}`) {
      // 密码版本不一致，登录期间已更改过密码
      throw new BusinessException(ErrorEnum.INVALID_LOGIN)
    }

    // 不允许多端登录
    if (!this.appConfig.multiDeviceLogin) {
      const cacheToken = await this.authService.getTokenByUid(request.user.uid)
      if (token !== cacheToken) {
        // 与redis保存不一致 即二次登录(1105:您的账号已在其他地方登录)
        throw new BusinessException(ErrorEnum.ACCOUNT_LOGGED_IN_ELSEWHERE)
      }
    }

    return result
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException()
    }
    return user
  }
}
