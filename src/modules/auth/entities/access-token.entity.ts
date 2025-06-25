import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { UserEntity } from '@/modules/user/entities/user.entity'
import { RefreshTokenEntity } from './refresh-token.entity'

@Entity('user_access_tokens')
export class AccessTokenEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ length: 500 })
  value!: string

  @Column({ comment: '令牌过期时间' })
  expired_at!: Date

  @CreateDateColumn({ comment: '令牌创建时间' })
  created_at!: Date

  @OneToOne(() => RefreshTokenEntity, refreshToken => refreshToken.accessToken, {
    cascade: true
  })
  refreshToken!: RefreshTokenEntity

  @ManyToOne(() => UserEntity, user => user.accessTokens, {
    // 当一个用户（UserEntity）被删除时，所有关联的访问令牌（AccessTokenEntity）会被自动级联删除
    onDelete: 'CASCADE'
  })
  // 指定数据库中外键列名称
  // 告诉 TypeORM 在 AccessToken 表中创建一个名为 user_id 的外键列，用于关联 User 表的主键
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity
}
