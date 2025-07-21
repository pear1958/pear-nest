import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  Delete,
  Param,
  ParseArrayPipe,
  UseGuards
} from '@nestjs/common'
import { ApiOperation, ApiParam } from '@nestjs/swagger'
import { UserService } from './user.service'
import { UserDto, UserQueryDto, UserUpdateDto } from './dto/user.dto'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { UserEntity } from './user.entity'
import { Perm, definePermission } from '@/common/decorator/permission.decorator'
import { IdParam } from '@/common/decorator/id-param.decorator'
import { MenuService } from '../menu/menu.service'
import { UserPasswordDto } from './dto/password.dto'
import { Resource } from '@/common/decorator/resource.decorator'
import { ResourceGuard } from '@/modules/auth/guards/resource.guard'
import { menuList } from '@/mock/menuList'

export const permissions = definePermission('system:user', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  PASSWORD_UPDATE: 'password:update',
  PASSWORD_RESET: 'pass:reset'
} as const)

// @UseGuards(ResourceGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private menuService: MenuService
  ) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResult({ type: [UserEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: UserQueryDto) {
    return this.userService.list(dto)
  }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  @Perm(permissions.CREATE)
  async create(@Body() dto: UserDto): Promise<void> {
    await this.userService.create(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询用户' })
  @Perm(permissions.READ)
  @Resource(UserEntity)
  async read(@IdParam() id: number) {
    return this.userService.info(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  @Perm(permissions.UPDATE)
  @Resource(UserEntity)
  async update(@IdParam() id: number, @Body() dto: UserUpdateDto): Promise<void> {
    await this.userService.update(id, dto)
    await this.menuService.refreshPerms(id)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({
    name: 'id',
    type: String,
    // 参数可以是字符串或数字类型
    schema: { oneOf: [{ type: 'string' }, { type: 'number' }] }
  })
  @Perm(permissions.DELETE)
  @Resource(UserEntity)
  async delete(
    @Param('id', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
  ): Promise<void> {
    await this.userService.delete(ids)
    await this.userService.multiForbidden(ids)
  }

  @Post(':id/password')
  @ApiOperation({ summary: '更改用户密码' })
  @Perm(permissions.PASSWORD_UPDATE)
  @Resource(UserEntity)
  async password(@IdParam() id: number, @Body() dto: UserPasswordDto): Promise<void> {
    await this.userService.forceUpdatePassword(id, dto.password)
  }

  // ----------------------------------

  @Post('login')
  login() {
    return true
  }

  @Post('logout')
  logout() {
    return true
  }

  @Get('menu')
  getMenuList() {
    return menuList
  }

  @Get('info')
  getUserInfo() {
    return {
      userName: 'Admin',
      mobile: '18270993095',
      apartment: 'IT服务部',
      avatar: 'xxx',
      salary: 4500
    }
  }

  @Get('button')
  getAuthButton() {
    return {
      home: ['test1', 'add', 'delete', 'edit', 'query', '一键导出', '一键删除'],
      jsonForm: ['设备列表1', '设备列表2'],
      jsonTable: ['add', 'delete', 'query', 'salary']
    }
  }
}
