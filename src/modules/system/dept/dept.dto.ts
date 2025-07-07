import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

// 新增
export class DeptDto {
  @ApiProperty({ description: '部门名称' })
  @IsString()
  @MinLength(1)
  name: string

  @ApiProperty({ description: '父级部门id' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  parentId: number

  @ApiProperty({ description: '排序编号', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderNo: number
}

// 查询
export class DeptQueryDto {
  @ApiProperty({ description: '部门名称' })
  @IsString()
  @IsOptional()
  name?: string
}

export class MoveDept {
  @ApiProperty({ description: '当前部门ID' })
  @IsInt()
  @Min(0)
  id: number

  @ApiProperty({ description: '移动到指定父级部门的ID' })
  @IsInt()
  @Min(0)
  @IsOptional()
  parentId: number
}

export class MoveDeptDto {
  @ApiProperty({ description: '部门列表', type: [MoveDept] })
  @ValidateNested({ each: true })
  @Type(() => MoveDept)
  depts: MoveDept[]
}
