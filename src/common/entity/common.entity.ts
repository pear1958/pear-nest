import { ApiHideProperty } from '@nestjs/swagger'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Exclude } from 'class-transformer'

export abstract class CommonEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}

export abstract class CompleteEntity extends CommonEntity {
  @ApiHideProperty() // 从 Swagger 文档中隐藏
  @Exclude() // 将实体或 dto 转换为 json 格式返回给客户端时, 排除指定的属性
  @Column({ name: 'create_by', update: false, comment: '创建者', nullable: true })
  createdBy: number

  @ApiHideProperty()
  @Exclude()
  @Column({ name: 'update_by', comment: '更新者', nullable: true })
  updatedBy: number
}
