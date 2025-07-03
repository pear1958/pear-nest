import { Controller, Get, Query } from '@nestjs/common'
import { MenuService } from './menu.service'
import { ApiOperation } from '@nestjs/swagger'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { MenuItemInfo } from './menu.model'
import { MenuQueryDto } from './menu.dto'

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // 菜单管理
  @Get('list')
  findAll(@Query() params: Recordable) {
    return this.menuService.findAll(params)
  }

  @Get('temp/list')
  @ApiOperation({ summary: '获取所有菜单列表' })
  @ApiResult({ type: [MenuItemInfo] })
  // @Perm(permissions.LIST)
  async list(@Query() dto: MenuQueryDto) {
    return this.menuService.list(dto)
  }
}
