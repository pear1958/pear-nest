import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TaskService } from './task.service'
import { definePermission } from '@/common/decorator/permission.decorator'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'

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
}
