import { Injectable } from '@nestjs/common'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
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

  create(createMenuDto: CreateMenuDto) {
    return 'This action adds a new menu'
  }

  findOne(id: number) {
    return `This action returns a #${id} menu`
  }

  update(id: number, updateMenuDto: UpdateMenuDto) {
    return `This action updates a #${id} menu`
  }

  remove(id: number) {
    return `This action removes a #${id} menu`
  }
}
