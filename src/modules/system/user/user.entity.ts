import { Column, Entity, JoinTable, ManyToMany, OneToMany, Relation } from 'typeorm'
import { Exclude } from 'class-transformer'
import { CommonEntity } from '@/common/entity/common.entity'
import { AccessTokenEntity } from '@/modules/auth/entities/access-token.entity'
import { RoleEntity } from '../role/role.entity'

@Entity({ name: 'sys_user' })
export class UserEntity extends CommonEntity {
  @Column({ unique: true })
  username: string

  @Exclude()
  @Column()
  password: string

  @Column({ length: 32 })
  psalt: string

  @Column({ nullable: true })
  nickname: string

  @Column({ name: 'avatar', nullable: true })
  avatar: string

  @Column({ nullable: true })
  qq: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  phone: string

  @Column({ nullable: true })
  remark: string

  @Column({ type: 'tinyint', nullable: true, default: 1 })
  status: number

  @ManyToMany(() => RoleEntity, role => role.users)
  @JoinTable({
    name: 'sys_user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Relation<RoleEntity[]>

  // @ManyToOne(() => DeptEntity, dept => dept.users)
  // @JoinColumn({ name: 'dept_id' })
  // dept: Relation<DeptEntity>

  // 通过accessToken的user字段 找到我
  @OneToMany(() => AccessTokenEntity, accessToken => accessToken.user, {
    // 保存 / 删除当前实体时，自动 保存 / 删除 关联实体
    // 无需手动调用 accessToken.save()，TypeORM 会自动将新 Token 持久化到数据库
    // 无需先手动删除所有 Token，TypeORM 会自动级联删除
    cascade: true
  })
  accessTokens: Relation<AccessTokenEntity[]>
}
