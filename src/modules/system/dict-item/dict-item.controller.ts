import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { DictItemService } from './dict-item.service'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { Pagination } from '@/helper/paginate/pagination'
import { DictItemEntity } from './dict-item.entity'
import { DictItemDto, DictItemQueryDto } from './dict-item.dto'
import { IdParam } from '@/common/decorator/id-param.decorator'
import { UpdaterPipe } from '@/common/pipe/updater.pipe'
import { CreatorPipe } from '@/common/pipe/creator.pipe'

export const permissions = definePermission('system:dict-item', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
} as const)

@ApiTags('System - 字典项模块')
@ApiSecurityAuth()
@Controller('dict-item')
export class DictItemController {
  constructor(private readonly dictItemService: DictItemService) {}

  @Get()
  @ApiOperation({ summary: '获取字典项列表' })
  @ApiResult({ type: [DictItemEntity], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: DictItemQueryDto): Promise<Pagination<DictItemEntity>> {
    return this.dictItemService.list(dto)
  }

  @Post()
  @ApiOperation({ summary: '新增字典项' })
  @Perm(permissions.CREATE)
  async create(@Body(CreatorPipe) dto: DictItemDto): Promise<void> {
    await this.dictItemService.create(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询字典项信息' })
  @ApiResult({ type: DictItemEntity })
  @Perm(permissions.READ)
  async info(@IdParam() id: number): Promise<DictItemEntity> {
    return this.dictItemService.findOne(id)
  }

  @Post(':id')
  @ApiOperation({ summary: '更新字典项' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) dto: DictItemDto): Promise<void> {
    await this.dictItemService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除指定的字典项' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    await this.dictItemService.delete(id)
  }
}
