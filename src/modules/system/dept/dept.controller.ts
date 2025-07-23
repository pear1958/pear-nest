import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { DeptService } from './dept.service'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { DeptDto, DeptQueryDto, MoveDeptDto } from './dept.dto'
import { DeptEntity } from './dept.entity'
import { AuthUser } from '@/constant/auth-user.decorator'
import { CreatorPipe } from '@/common/pipe/creator.pipe'
import { IdParam } from '@/common/decorator/id-param.decorator'
import { UpdaterPipe } from '@/common/pipe/updater.pipe'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'

export const permissions = definePermission('system:dept', {
  LIST: 'list',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
} as const)

@ApiSecurityAuth()
@ApiTags('System - 部门模块')
@Controller('dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @Get()
  @ApiOperation({ summary: '获取部门列表' })
  @ApiResult({ type: [DeptEntity] })
  @Perm(permissions.LIST)
  async list(@Query() dto: DeptQueryDto, @AuthUser('uid') uid: number): Promise<DeptEntity[]> {
    // return this.deptService.getDeptTree(uid, dto)
    return this.deptService.getDeptTree(1, dto)
  }

  @Post()
  @ApiOperation({ summary: '创建部门' })
  @Perm(permissions.CREATE)
  async create(@Body(CreatorPipe) dto: DeptDto): Promise<void> {
    await this.deptService.create(dto)
  }

  @Get(':id')
  @ApiOperation({ summary: '查询部门信息' })
  @Perm(permissions.READ)
  async info(@IdParam() id: number) {
    return this.deptService.info(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新部门' })
  @Perm(permissions.UPDATE)
  async update(@IdParam() id: number, @Body(UpdaterPipe) updateDeptDto: DeptDto): Promise<void> {
    await this.deptService.update(id, updateDeptDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除部门' })
  @Perm(permissions.DELETE)
  async delete(@IdParam() id: number): Promise<void> {
    // 查询是否有关联用户或者部门，如果含有则无法删除
    const count = await this.deptService.countUserByDeptId(id)
    if (count > 0) {
      // 该部门存在关联用户，请先删除关联用户
      throw new BusinessException(ErrorEnum.DEPARTMENT_HAS_ASSOCIATED_USERS)
    }

    const count2 = await this.deptService.countChildDept(id)
    if (count2 > 0) {
      // 该部门存在子部门，请先删除子部门
      throw new BusinessException(ErrorEnum.DEPARTMENT_HAS_CHILD_DEPARTMENTS)
    }

    await this.deptService.delete(id)
  }

  @Post('move')
  @ApiOperation({ summary: '部门移动排序' })
  async move(@Body() dto: MoveDeptDto): Promise<void> {
    await this.deptService.move(dto.depts)
  }
}
