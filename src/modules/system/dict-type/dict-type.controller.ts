import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { DictTypeService } from './dict-type.service'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { DictTypeEntity } from './dict-type.entity'
import { Pagination } from '@/helper/paginate/pagination'
import { DictTypeDto, DictTypeQueryDto } from './dict-type.dto'
import { CreatorPipe } from '@/common/pipe/creator.pipe'
import { IdParam } from '@/common/decorator/id-param.decorator'
import { UpdaterPipe } from '@/common/pipe/updater.pipe'

export const permissions = definePermission('system:dict-type', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
} as const)

@ApiTags('System - 字典类型模块')
@ApiSecurityAuth()
@Controller('dict-type')
export class DictTypeController {
  constructor(private readonly dictTypeService: DictTypeService) {}

  @Get()
  @ApiOperation({ summary: '获取字典类型列表' })
  @ApiResult({ type: [DictTypeEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: DictTypeQueryDto): Promise<Pagination<DictTypeEntity>> {
    return this.dictTypeService.list(dto)
  }

  @Get('select-options')
  @ApiOperation({ summary: '一次性获取所有的字典类型(不分页)' })
  @ApiResult({ type: [DictTypeEntity] })
  @Perm(permissions.LIST)
  async getAll(): Promise<DictTypeEntity[]> {
    return this.dictTypeService.getAll()
  }

  @Post()
  @ApiOperation({ summary: '新增字典类型' })
  @Perm(permissions.CREATE)
  async create(@Body(CreatorPipe) dto: DictTypeDto): Promise<void> {
    await this.dictTypeService.create(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询字典类型信息' })
  @ApiResult({ type: DictTypeEntity })
  @Perm(permissions.READ)
  async info(@IdParam() id: number): Promise<DictTypeEntity> {
    return this.dictTypeService.findOne(id)
  }

  @Post(':id')
  @ApiOperation({ summary: '更新字典类型' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) dto: DictTypeDto): Promise<void> {
    await this.dictTypeService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除指定的字典类型' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    await this.dictTypeService.delete(id)
  }
}
