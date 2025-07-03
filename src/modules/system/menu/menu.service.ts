import { Injectable } from '@nestjs/common'
import { menuList } from './mockData'

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
}
