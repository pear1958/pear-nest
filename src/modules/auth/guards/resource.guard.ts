import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { isArray, isEmpty, isNil } from 'lodash'
import { DataSource, In, Repository } from 'typeorm'
import { ResourceObject } from '@/common/decorator/resource.decorator'
import { BusinessException } from '@/common/exception/business.exception'
import { PUBLIC_KEY, RESOURCE_KEY, Roles } from '@/constant/auth.constant'
import { ErrorEnum } from '@/constant/error-code.constant'

/**
 * 对资源访问进行权限验证，确保用户只能访问和操作属于自己的数据，除非该用户是超级管理员
 * 1.假设系统中有一个用户个人信息管理模块，用户可以查看和修改自己的信息，但不能查看或修改其他用户的信息
 * 2.在文章管理系统中，作者只能查看、编辑和删除自己发表的文章，而不能操作其他作者的文章
 */
@Injectable()
export class ResourceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource
  ) {}

  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (isPublic) return true
    const request = context.switchToHttp().getRequest<FastifyRequest>()

    // 如果没有用户信息，则拒绝访问
    const { user } = request
    if (!user) return false

    // 从元数据中获取资源对象，包含实体和条件
    // 如果是检查资源所属，且不是超级管理员，还需要进一步判断是否是自己的数据
    const { entity, condition } = this.reflector.get<ResourceObject>(
      RESOURCE_KEY,
      context.getHandler()
    ) ?? { entity: null, condition: null }

    // 如果存在实体且用户不是超级管理员，则需要进一步验证资源所属
    if (entity && !user.roles.includes(Roles.ADMIN)) {
      // 获取该实体的存储库
      const repo: Repository<any> = this.dataSource.getRepository(entity)

      /**
       * 获取请求中的 items (ids) 验证数据拥有者
       */
      const getRequestItems = (request?: FastifyRequest): number[] => {
        const { params = {}, body = {}, query = {} } = (request ?? {}) as any
        const id = params.id ?? body.id ?? query.id
        if (id) return [id]
        const { items } = body
        return !isNil(items) && isArray(items) ? items : []
      }

      // 获取请求中的资源 ID 数组
      const items = getRequestItems(request)

      // 所请求的资源不存在
      if (isEmpty(items)) {
        throw new BusinessException(ErrorEnum.REQUESTED_RESOURCE_NOT_FOUND)
      }

      // 如果存在自定义验证条件，则调用该条件进行验证
      if (condition) return condition(repo, items, user)

      const recordQuery = {
        where: {
          id: In(items), // 找出需要操作的这些id
          // 他的 user 即所属人 是否为当前操作的用户
          user: { id: user.uid } // 判断这些 id 是否属于当前请求的用户id
        },
        relations: ['user']
      }

      const records = await repo.find(recordQuery)

      // 所请求的资源不存在
      if (isEmpty(records)) {
        throw new BusinessException(ErrorEnum.REQUESTED_RESOURCE_NOT_FOUND)
      }
    }

    return true
  }
}
