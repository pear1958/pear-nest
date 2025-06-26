import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Post('login')
  // login(@Body() createUserDto: CreateUserDto) {
  //   return this.userService.create(createUserDto)
  // }

  @Post()
  @ApiOperation({ summary: '新增用户' })
  // @Perm(permissions.CREATE)
  // async create(@Body() dto: UserDto): Promise<void> {
  //   await this.userService.create(dto)
  // }
  @Post('logout')
  logout() {
    return true
  }

  @Get('menu')
  getMenuList() {
    return this.userService.findAll()
  }

  @Get('info')
  getUserInfo() {
    return this.userService.getUserInfo()
  }

  @Get('button')
  getAuthButton() {
    return this.userService.getAuthButton()
  }
}
