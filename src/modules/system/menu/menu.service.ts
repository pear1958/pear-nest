import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { Like, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { isEmpty, isNil } from 'lodash'
import { menuList } from './mockData'
import { MenuDto, MenuQueryDto, MenuType, MenuUpdateDto } from './menu.dto'
import { MenuEntity } from './menu.entity'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { deleteEmptyChildren } from '@/utils/list2tree.util'
import { generateMenu } from '@/utils/permission.util'
import { paginate } from '@/helper/paginate'
import { Pagination } from '@/helper/paginate/pagination'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { genAuthPermKey, genAuthTokenKey } from '@/helper/genRedisKey'
import { RedisKeys } from '@/constant/cache.constant'

export const getMockMenuData = params => {
  // const mockStatus = ['all', 'open', 'processing', 'closed']
  const { current, pageSize } = params
  const startIndex = (current - 1) / pageSize
  return menuList.slice(startIndex, current * pageSize)
}

@Injectable()
export class MenuService {
  constructor(
    @InjectRedis() private redis: Redis,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>
  ) {}

  findAll(params: Recordable) {
    return {
      list: getMockMenuData(params),
      total: 10
    }
  }

  /**
   * 获取所有菜单以及权限
   */
  async list({ name, path, permission, component, status }: MenuQueryDto): Promise<MenuEntity[]> {
    const menus = await this.menuRepository.find({
      where: {
        ...(name && { name: Like(`%${name}%`) }),
        ...(path && { path: Like(`%${path}%`) }),
        ...(permission && { permission: Like(`%${permission}%`) }),
        ...(component && { component: Like(`%${component}%`) }),
        ...(!isNil(status) ? { status } : null)
      },
      order: { orderNo: 'ASC' }
    })

    const menuList = generateMenu(menus)

    if (!isEmpty(menuList)) {
      deleteEmptyChildren(menuList)
      return menuList
    }

    return []
  }

  async list2({
    page,
    pageSize,
    name,
    path,
    permission,
    component,
    status
  }: MenuQueryDto): Promise<Pagination<MenuEntity>> {
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')

    const queryParams = {
      name,
      path,
      permission,
      component,
      status
    }

    // 遍历查询参数对象，动态添加查询条件
    Object.entries(queryParams).forEach(([key, value]) => {
      if (isNil(value)) return

      const [query, parameters] =
        typeof value === 'string'
          ? [`menu.${key} LIKE :${key}`, { [key]: `%${value}%` }]
          : [`menu.${key} = :${key}`, { [key]: value }] // status 是 number

      queryBuilder.andWhere(query, parameters)
    })

    queryBuilder.orderBy('menu.orderNo', 'ASC')

    const { items, meta } = await paginate(queryBuilder, { page, pageSize })
    const menuList = generateMenu(items)

    if (!isEmpty(menuList)) {
      deleteEmptyChildren(menuList)
      return { items: menuList, meta }
    } else {
      return { items, meta }
    }
  }

  async check(dto: Partial<MenuDto>): Promise<void | never> {
    // 无法在根目录下新建权限(前端传的数据基本不会走到这里)
    if (dto.type === MenuType.PERMISSION && !dto.parentId) {
      throw new BusinessException(ErrorEnum.PERMISSION_REQUIRES_PARENT)
    }

    // 目录 & parentId 存在
    if (dto.type === MenuType.MENU && dto.parentId) {
      const parent = await this.menuRepository.findOneBy({ id: dto.parentId })

      if (isEmpty(parent)) {
        // 前端传的数据基本不会走到这里
        throw new BusinessException(ErrorEnum.PARENT_MENU_NOT_FOUND)
      }

      // 父节点选择 菜单 | 权限 时无法新建菜单
      if ([MenuType.MENU, MenuType.PERMISSION].includes(parent?.type)) {
        throw new BusinessException(ErrorEnum.ILLEGAL_OPERATION_DIRECTORY_PARENT)
      }
    }
  }

  async create(menu: MenuDto): Promise<void> {
    await this.menuRepository.save(menu)
  }

  /**
   * 获取当前用户的所有权限
   */
  async getPermissions(uid: number): Promise<string[]> {
    return []
  }

  /**
   * 刷新所有在线用户的权限
   */
  async refreshOnlineUserPerms(): Promise<void> {
    const onlineUserIds: string[] = await this.redis.keys(genAuthTokenKey('*'))

    if (!onlineUserIds?.length) return

    const promiseArr = onlineUserIds
      .map(i => Number.parseInt(i.split(RedisKeys.AUTH_TOKEN_PREFIX)[1]))
      .filter(i => i)
      .map(async uid => {
        const perms = await this.getPermissions(uid)
        await this.redis.set(genAuthPermKey(uid), JSON.stringify(perms))
      })

    await Promise.all(promiseArr)
  }

  async update(id: number, menu: MenuUpdateDto): Promise<void> {
    await this.menuRepository.update(id, menu)
  }
}
