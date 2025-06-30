import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common'
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'
import { UserService } from '@/modules/user/user.service'
import { AccountInfo } from '@/modules/user/user.model'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { AuthService } from '../auth.service'
import { AuthUser } from '../decorators/auth-user.decorator'
import { AllowAnon } from '../decorators/allow-anon.decorator'

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
    await this.authService.clearLoginStatus(user, req.accessToken)
  }
}
