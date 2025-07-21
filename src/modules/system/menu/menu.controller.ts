import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Delete,
  BadRequestException
} from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { flattenDeep } from 'lodash'
import { MenuService } from './menu.service'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { MenuItemInfo } from './menu.model'
import { MenuDto, MenuQueryDto, MenuType, MenuUpdateDto } from './menu.dto'
import { CreatorPipe } from '@/common/pipe/creator.pipe'
import { UpdaterPipe } from '@/common/pipe/updater.pipe'
import { IdParam } from '@/common/decorator/id-param.decorator'
import {
  definePermission,
  getDefinePermissions,
  Perm
} from '@/common/decorator/permission.decorator'

export const permissions = definePermission('system:menu', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
} as const)

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // http://localhost:3000/api/system/menu/list?page=1&pageSize=5
  @Get('list')
  @ApiOperation({ summary: '获取所有菜单列表' })
  @ApiResult({ type: [MenuItemInfo] })
  @Perm(permissions.LIST)
  async list(@Query() dto: MenuQueryDto) {
    return this.menuService.list(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取菜单或权限信息' })
  @Perm(permissions.READ)
  async info(@IdParam() id: number) {
    return this.menuService.getMenuItemAndParentInfo(id)
  }

  @Post()
  @ApiOperation({ summary: '新增菜单或权限' })
  @Perm(permissions.CREATE)
  async create(@Body(CreatorPipe) dto: MenuDto): Promise<void> {
    await this.menuService.check(dto)
    // 根目录
    if (!dto.parentId) dto.parentId = null
    await this.menuService.create(dto)
    // 如果是权限发生更改，则刷新所有在线用户的权限
    if (dto.type === MenuType.PERMISSION) {
      await this.menuService.refreshOnlineUserPerms()
    }
  }

  @Put(':id')
  @ApiOperation({ summary: '更新菜单或权限' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) dto: MenuUpdateDto): Promise<void> {
    await this.menuService.check(dto)
    if (dto.parentId === -1 || !dto.parentId) {
      dto.parentId = null
    }
    await this.menuService.update(id, dto)
    // 如果是权限发生更改，则刷新所有在线用户的权限
    if (dto.type === MenuType.PERMISSION) {
      await this.menuService.refreshOnlineUserPerms()
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜单或权限' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    if (await this.menuService.checkRoleByMenuId(id)) {
      throw new BadRequestException('该菜单存在关联角色，无法删除')
    }

    // 如果有子目录，一并删除
    const childIdList = await this.menuService.findChildMenus(id)
    await this.menuService.deleteMenuItem(flattenDeep([id, childIdList]))
    // 刷新在线用户权限
    await this.menuService.refreshOnlineUserPerms()
  }

  @Get('permissions')
  @ApiOperation({ summary: '获取后端定义的所有权限集' })
  async getPermissions(): Promise<string[]> {
    return getDefinePermissions()
  }
}
