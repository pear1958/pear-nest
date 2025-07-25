import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { LoginLogService } from './services/login-log.service'
import { CaptchaLogService } from './services/captcha-log.service'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { Pagination } from '@/helper/paginate/pagination'
import { LoginLogInfo } from './log.model'
import { CaptchaLogQueryDto, LoginLogQueryDto, TaskLogQueryDto } from './log.dto'
import { CaptchaLogEntity } from './entities/captcha-log.entity'
import { TaskLogEntity } from './entities/task-log.entity'
import { TaskLogService } from './services/task-log.service'

export const permissions = definePermission('system:log', {
  TaskList: 'task:list',
  LogList: 'login:list',
  CaptchaList: 'captcha:list'
} as const)

@ApiSecurityAuth()
@ApiTags('System - 日志模块')
@Controller('log')
export class LogController {
  constructor(
    private loginLogService: LoginLogService,
    private captchaLogService: CaptchaLogService,
    private taskService: TaskLogService
  ) {}

  @Get('login/list')
  @ApiOperation({ summary: '查询登录日志列表' })
  @ApiResult({ type: [LoginLogInfo], isPage: true })
  @Perm(permissions.TaskList)
  async loginLogPage(@Query() dto: LoginLogQueryDto): Promise<Pagination<LoginLogInfo>> {
    return this.loginLogService.list(dto)
  }

  @Get('captcha/list')
  @ApiOperation({ summary: '查询验证码日志列表' })
  @ApiResult({ type: [CaptchaLogEntity], isPage: true })
  @Perm(permissions.CaptchaList)
  async captchaList(@Query() dto: CaptchaLogQueryDto): Promise<Pagination<CaptchaLogEntity>> {
    return this.captchaLogService.list(dto)
  }

  @Get('task/list')
  @ApiOperation({ summary: '查询任务日志列表' })
  @ApiResult({ type: [TaskLogEntity], isPage: true })
  @Perm(permissions.LogList)
  async taskList(@Query() dto: TaskLogQueryDto) {
    return this.taskService.list(dto)
  }
}
