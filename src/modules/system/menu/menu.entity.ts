import { Column, Entity, ManyToMany, Relation } from 'typeorm'
import { CompleteEntity } from '@/common/entity/common.entity'
import { RoleEntity } from '../role/role.entity'

@Entity({ name: 'sys_menu' })
export class MenuEntity extends CompleteEntity {
  @Column({ name: 'parent_id', nullable: true })
  parentId: number // 父节点

  @Column()
  name: string // 菜单名

  @Column({ nullable: true })
  path: string // 路由地址

  @Column({ nullable: true })
  permission: string // 对应控制器中定义的权限字符，如：@Perm('system:menu:list'))

  @Column({ type: 'tinyint', default: 0 })
  type: number // 菜单类型 目录:菜单:权限

  @Column({ nullable: true, default: '' })
  icon: string // 菜单图标

  @Column({ name: 'order_no', type: 'int', nullable: true, default: 0 })
  orderNo: number // 菜单排序

  @Column({ name: 'component', nullable: true })
  component: string // 组件路径

  @Column({ name: 'is_ext', type: 'boolean', default: false })
  isExt: boolean // 是否为外链

  @Column({ name: 'ext_open_mode', type: 'tinyint', default: 1 })
  extOpenMode: number

  @Column({ name: 'keep_alive', type: 'tinyint', default: 1 })
  keepAlive: number // 是否缓存

  @Column({ type: 'tinyint', default: 1 })
  show: number // 是否显示在左侧菜单(会生成路由)

  @Column({ name: 'active_menu', nullable: true })
  activeMenu: string // 指定当前菜单被激活（或对应路由被访问）时，需要高亮显示的关联菜单标识

  @Column({ type: 'tinyint', default: 1 })
  status: number // 1: 正常 0: 不会生成路由(左侧菜单不可见)

  @ManyToMany(() => RoleEntity, role => role.menus, {
    onDelete: 'CASCADE'
  })
  roles: Relation<RoleEntity[]>
}
