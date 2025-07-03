import { Controller, Get, Query } from '@nestjs/common'
import { MenuService } from './menu.service'

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // 菜单管理
  @Get('list')
  findAll(@Query() params: Recordable) {
    return this.menuService.findAll(params)
  }
}
