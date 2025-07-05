import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthService } from '../auth.service'
import { ALLOW_ANON_KEY, PERMISSION_KEY, PUBLIC_KEY, Roles } from '@/constant/auth.constant'
import { FastifyRequest } from 'fastify'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) return true

    const request = context.switchToHttp().getRequest<FastifyRequest>()

    const { user } = request
    if (!user) throw new BusinessException(ErrorEnum.INVALID_LOGIN)

    // allowAnon 是需要登录后可访问(无需权限), Public 则是无需登录也可访问.
    const allowAnon = this.reflector.get<boolean>(ALLOW_ANON_KEY, context.getHandler())
    if (allowAnon) return true

    // 控制器设置的权限
    const payloadPermission = this.reflector.getAllAndOverride<string | string[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    // 控制器没有设置接口权限，则默认通过
    if (!payloadPermission) return true

    // 管理员直接放行
    if (user.roles.includes(Roles.ADMIN)) return true

    const userPermissionList =
      (await this.authService.getPermissionsCache(user.uid)) ??
      (await this.authService.getPermissions(user.uid))

    let canNext = false

    if (Array.isArray(payloadPermission)) {
      // 需要的权限 用户都有
      canNext = payloadPermission.every(i => userPermissionList.includes(i))
    }

    if (typeof payloadPermission === 'string') {
      canNext = userPermissionList.includes(payloadPermission)
    }

    if (!canNext) {
      throw new BusinessException(ErrorEnum.NO_PERMISSION)
    }

    return true
  }
}
