import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TaskService } from './task.service'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { TaskDto, TaskQueryDto, TaskUpdateDto } from './task.dto'
import { IdParam } from '@/common/decorator/id-param.decorator'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { TaskEntity } from './task.entity'
import { Pagination } from '@/helper/paginate/pagination'

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
@Controller('tasks')
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

  @Put(':id')
  @ApiOperation({ summary: '更新任务' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body() dto: TaskUpdateDto): Promise<void> {
    const serviceCall = dto.service.split('.')
    await this.taskService.checkHasMissionMeta(serviceCall[0], serviceCall[1])
    await this.taskService.update(id, dto)
  }

  @Get()
  @ApiOperation({ summary: '获取任务列表' })
  @ApiResult({ type: [TaskEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: TaskQueryDto): Promise<Pagination<TaskEntity>> {
    return this.taskService.list(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询任务详细信息' })
  @ApiResult({ type: TaskEntity })
  @Perm(permissions.READ)
  async info(@IdParam() id: number): Promise<TaskEntity> {
    return this.taskService.info(id)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除任务' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    const task = await this.taskService.info(id)
    await this.taskService.delete(task)
  }

  @Put(':id/once')
  @ApiOperation({ summary: '手动执行一次任务' })
  @Perm(permissions.ONCE)
  async once(@IdParam() id: number): Promise<void> {
    const task = await this.taskService.info(id)
    await this.taskService.once(task)
  }

  @Put(':id/stop')
  @ApiOperation({ summary: '停止任务' })
  @Perm(permissions.STOP)
  async stop(@IdParam() id: number): Promise<void> {
    const task = await this.taskService.info(id)
    await this.taskService.stop(task)
  }

  @Put(':id/start')
  @ApiOperation({ summary: '启动任务' })
  @Perm(permissions.START)
  async start(@IdParam() id: number): Promise<void> {
    const task = await this.taskService.info(id)
    await this.taskService.start(task)
  }
}
