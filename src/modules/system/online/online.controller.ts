import { Body, Controller, Get, Post, Req } from '@nestjs/common'
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'
import { OnlineService } from './online.service'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { OnlineUserInfo } from './online.model'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { KickDto } from './online.dto'
import { AuthUser } from '@/constant/auth-user.decorator'

export const permissions = definePermission('system:online', ['list', 'kick'] as const)

@ApiTags('System - 在线用户模块')
@ApiSecurityAuth()
@ApiExtraModels(OnlineUserInfo)
@Controller('online')
export class OnlineController {
  constructor(private readonly onlineService: OnlineService) {}

  @Get('list')
  @ApiOperation({ summary: '查询当前在线用户' })
  @ApiResult({ type: [OnlineUserInfo] })
  @Perm(permissions.LIST)
  async list(@Req() req: FastifyRequest): Promise<OnlineUserInfo[]> {
    return this.onlineService.list(req.accessToken)
  }

  @Post('kick')
  @ApiOperation({ summary: '下线指定在线用户' })
  @Perm(permissions.KICK)
  async kick(@Body() dto: KickDto, @AuthUser() user: AuthUser): Promise<void> {
    await this.onlineService.kickUser(dto.tokenId, user)
  }
}
