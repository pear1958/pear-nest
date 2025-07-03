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

    const menuList = menus

    if (!isEmpty(menuList)) {
      deleteEmptyChildren(menuList)
      return menuList
    }

    return []
  }
}
