import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Column, Entity, OneToMany, Relation, Tree, TreeChildren, TreeParent } from 'typeorm'
import { CompleteEntity } from '@/common/entity/common.entity'
import { UserEntity } from '../user/user.entity'

@Entity({ name: 'sys_dept' })
// 提升 TypeORM 的查询效率  默认数据库需要定义 mpath 字段
@Tree('materialized-path')
export class DeptEntity extends CompleteEntity {
  @Column()
  @ApiProperty({ description: '部门名称' })
  name: string

  @Column({ nullable: true, default: 0 })
  @ApiProperty({ description: '排序' })
  orderNo: number

  @TreeChildren({ cascade: true })
  children: DeptEntity[]

  // @TreeParent 是 TypeORM 用于标记树形结构中父节点关系的装饰器
  // 可以确保在删除父节点时，不会级联删除子节点，而是将子节点的父节点引用置为 NULL，从而保证数据的完整性
  // 指定当父节点被删除时，子节点的 parent 字段 设置为 NULL
  // TypeORM 会在数据库操作时自动把 parent 属性转换为对应的 parentId 字段
  @TreeParent({ onDelete: 'SET NULL' })
  parent?: DeptEntity

  @ApiHideProperty()
  @OneToMany(() => UserEntity, user => user.dept)
  users: Relation<UserEntity[]>
}
