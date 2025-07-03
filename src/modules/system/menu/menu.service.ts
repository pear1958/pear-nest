import { Injectable } from '@nestjs/common'
import { menuList } from './mockData'
import { MenuQueryDto } from './menu.dto'
import { MenuEntity } from './menu.entity'

export const getMockMenuData = params => {
  // const mockStatus = ['all', 'open', 'processing', 'closed']
  const { current, pageSize } = params
  const startIndex = (current - 1) / pageSize
  return menuList.slice(startIndex, current * pageSize)
}

@Injectable()
export class MenuService {
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
    return []
  }
}
