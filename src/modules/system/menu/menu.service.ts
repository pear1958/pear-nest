import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { Like, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { menuList } from './mockData'
import { MenuQueryDto } from './menu.dto'
import { MenuEntity } from './menu.entity'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { isEmpty, isNil } from 'lodash'
import { deleteEmptyChildren } from '@/utils/list2tree.util'
import { generateMenu } from '@/utils/permission.util'
import { paginate } from '@/helper/paginate'
import { Pagination } from '@/helper/paginate/pagination'

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
}
