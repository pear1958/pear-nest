import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common'
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'
import { UserService } from '@/modules/system/user/user.service'
import { AccountInfo } from '@/modules/system/user/user.model'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { AuthService } from '../auth.service'
import { AuthUser } from '../../../constant/auth-user.decorator'
import { AllowAnon } from '../../../constant/allow-anon.decorator'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { AccountMenus, AccountUpdateDto } from '../dto/account.dto'
import { PasswordUpdateDto } from '@/modules/system/user/dto/password.dto'

@ApiTags('Account - 账户模块')
@ApiSecurityAuth()
@ApiExtraModels(AccountInfo)
@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  @Get('logout')
  @ApiOperation({ summary: '账户登出' })
  @AllowAnon()
  async logout(@AuthUser() user: AuthUser, @Req() req: FastifyRequest): Promise<void> {
    // 前端: 204 data: ''
    await this.authService.clearLoginStatus(user, req.accessToken)
  }

  @Get('profile')
  @ApiOperation({ summary: '获取账户资料' })
  @ApiResult({ type: AccountInfo })
  @AllowAnon()
  async profile(@AuthUser() user: AuthUser): Promise<AccountInfo> {
    return this.userService.getAccountInfo(user.uid)
  }

  @Put('update')
  @ApiOperation({ summary: '更改账户资料' })
  @AllowAnon()
  async update(@AuthUser() user: AuthUser, @Body() dto: AccountUpdateDto): Promise<void> {
    await this.userService.updateAccountInfo(user.uid, dto)
  }

  @Post('password')
  @ApiOperation({ summary: '更改账户密码' })
  @AllowAnon()
  async password(@AuthUser() user: AuthUser, @Body() dto: PasswordUpdateDto): Promise<void> {
    await this.userService.updatePassword(user.uid, dto)
  }

  @Get('menus')
  @ApiOperation({ summary: '获取菜单列表' })
  @ApiResult({ type: [AccountMenus] })
  @AllowAnon()
  async menu(@AuthUser() user: AuthUser) {
    return this.authService.getMenus(user.uid)
  }

  @Get('permissions')
  @ApiOperation({ summary: '获取权限列表' })
  @ApiResult({ type: [String] })
  @AllowAnon()
  async permissions(@AuthUser() user: AuthUser): Promise<string[]> {
    return this.authService.getPermissions(user.uid)
  }
}
