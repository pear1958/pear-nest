import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { MenuService } from './menu.service'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto)
  }

  @Get('list')
  findAll(@Query() params: Recordable) {
    return this.menuService.findAll(params)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(+id, updateMenuDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(+id)
  }
}
