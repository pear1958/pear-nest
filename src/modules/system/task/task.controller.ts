import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TaskService } from './task.service'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { TaskDto } from './task.dto'

export const permissions = definePermission('system:task', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',

  ONCE: 'once',
  START: 'start',
  STOP: 'stop'
} as const)

@ApiTags('System - 任务调度模块')
@ApiSecurityAuth()
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: '添加任务' })
  @Perm(permissions.CREATE)
  async create(@Body() dto: TaskDto): Promise<void> {
    // eg: LogClearJob.clearLoginLog
    const serviceCall = dto.service.split('.')
    await this.taskService.checkHasMissionMeta(serviceCall[0], serviceCall[1])
    await this.taskService.create(dto)
  }
}
