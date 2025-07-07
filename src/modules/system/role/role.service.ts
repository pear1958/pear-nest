import { Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { EntityManager, In, Like, Repository } from 'typeorm'
import { isEmpty, isNil } from 'lodash'
import { RoleEntity } from './role.entity'
import { ROOT_ROLE_ID } from '@/constant/system.constant'
import { RoleDto, RoleQueryDto, RoleUpdateDto } from './role.dto'
import { Pagination } from '@/helper/paginate/pagination'
import { paginate } from '@/helper/paginate'
import { MenuEntity } from '../menu/menu.entity'

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity) private roleRepository: Repository<RoleEntity>,
    @InjectRepository(MenuEntity) private menuRepository: Repository<MenuEntity>,
    @InjectEntityManager() private entityManager: EntityManager
  ) {}

  /**
   * 根据用户id查找角色信息
   */
  async getRoleIdsByUser(id: number): Promise<number[]> {
    const roles = await this.roleRepository.find({
      where: {
        users: { id }
      }
    })

    if (!isEmpty(roles)) return roles.map(r => r.id)

    return []
  }

  hasAdminRole(rids: number[]): boolean {
    return rids.includes(ROOT_ROLE_ID)
  }

  async getRoleValues(ids: number[]): Promise<string[]> {
    const rows = await this.roleRepository.findBy({
      id: In(ids)
    })
    return rows.map(r => r.value)
  }

  /**
   * 查询角色列表
   */
  list({
    page,
    pageSize,
    name,
    value,
    remark,
    status
  }: RoleQueryDto): Promise<Pagination<RoleEntity>> {
    const queryBuilder = this.roleRepository.createQueryBuilder('role').where({
      ...(name ? { name: Like(`%${name}%`) } : null),
      ...(value ? { value: Like(`%${value}%`) } : null),
      ...(remark ? { remark: Like(`%${remark}%`) } : null),
      ...(!isNil(status) ? { status } : null)
    })
    return paginate<RoleEntity>(queryBuilder, {
      page,
      pageSize
    })
  }

  /**
   * 根据角色获取角色信息
   */
  async info(id: number) {
    const info = await this.roleRepository
      .createQueryBuilder('role')
      .where({
        id
      })
      .getOne()

    const menus = await this.menuRepository.find({
      where: { roles: { id } },
      select: ['id']
    })

    return { ...info, menuIds: menus.map(m => m.id) }
  }

  /**
   * 增加角色
   */
  async create({ menuIds, ...data }: RoleDto): Promise<{ roleId: number }> {
    const role = await this.roleRepository.save({
      ...data,
      // 多对多关系会自动处理
      menus: menuIds ? await this.menuRepository.findBy({ id: In(menuIds) }) : []
    })

    return { roleId: role.id }
  }

  /**
   * 更新角色信息
   * 如果传入的menuIds为空，则清空sys_role_menus表中存有的关联数据，参考新增
   */
  async update(id: number, { menuIds, ...data }: RoleUpdateDto): Promise<void> {
    await this.roleRepository.update(id, data)

    await this.entityManager.transaction(async manager => {
      const role = await this.roleRepository.findOne({ where: { id } })
      // 需要保存的 menuIds 必须都在数据库中存在对应的 menu
      role.menus = menuIds?.length ? await this.menuRepository.findBy({ id: In(menuIds) }) : []
      await manager.save(role)
    })
  }

  /**
   * 根据角色ID查找是否有关联用户
   */
  async checkUserByRoleId(id: number): Promise<boolean> {
    return this.roleRepository.exist({
      where: {
        users: {
          roles: { id }
        }
      }
    })
  }

  async delete(id: number): Promise<void> {
    if (id === ROOT_ROLE_ID) throw new Error('不能删除超级管理员')
    await this.roleRepository.delete(id)
  }
}
