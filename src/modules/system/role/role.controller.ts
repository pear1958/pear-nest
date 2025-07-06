import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Put,
  Delete,
  BadRequestException
} from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { RoleService } from './role.service'
import { Perm, definePermission } from '@/common/decorator/permission.decorator'
import { MenuService } from '../menu/menu.service'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { RoleEntity } from './role.entity'
import { RoleDto, RoleQueryDto, RoleUpdateDto } from './role.dto'
import { IdParam } from '@/common/decorator/id-param.decorator'
import { RoleInfo } from './role.model'
import { UpdaterPipe } from '@/common/pipe/updater.pipe'

export const permissions = definePermission('system:role', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
} as const)

@Controller('role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private menuService: MenuService
  ) {}

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  @ApiResult({ type: [RoleEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: RoleQueryDto) {
    return this.roleService.list(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色信息' })
  @ApiResult({ type: RoleInfo })
  @Perm(permissions.READ)
  async info(@IdParam() id: number) {
    return this.roleService.info(id)
  }

  @Post()
  @ApiOperation({ summary: '新增角色' })
  @Perm(permissions.CREATE)
  async create(@Body() dto: RoleDto): Promise<void> {
    await this.roleService.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) dto: RoleUpdateDto): Promise<void> {
    await this.roleService.update(id, dto)
    await this.menuService.refreshOnlineUserPerms()
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    const exist = await this.roleService.checkUserByRoleId(id)
    if (exist) {
      throw new BadRequestException('该角色存在关联用户，无法删除')
    }
    await this.roleService.delete(id)
    await this.menuService.refreshOnlineUserPerms()
  }
}
