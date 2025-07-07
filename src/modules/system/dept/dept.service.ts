import { Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository, TreeRepository } from 'typeorm'
import { DeptDto, DeptQueryDto, MoveDept } from './dept.dto'
import { DeptEntity } from './dept.entity'
import { UserEntity } from '../user/user.entity'
import { deleteEmptyChildren } from '@/utils/list2tree.util'
import { isEmpty } from 'lodash'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'

@Injectable()
export class DeptService {
  constructor(
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    @InjectRepository(DeptEntity) private deptRepository: TreeRepository<DeptEntity>,
    @InjectEntityManager() private entityManager: EntityManager
  ) {}

  /**
   * 获取部门列表树结构
   */
  async getDeptTree(uid: number, { name }: DeptQueryDto): Promise<DeptEntity[]> {
    const tree: DeptEntity[] = []

    if (name) {
      const deptList = await this.deptRepository
        .createQueryBuilder('dept')
        .where('dept.name like :name', { name: `%${name}%` })
        .getMany()

      for (const dept of deptList) {
        // 底层实现会借助 mpath 字段来查找指定节点的所有后代节点
        const deptTree = await this.deptRepository.findDescendantsTree(dept)
        tree.push(deptTree)
      }

      deleteEmptyChildren(tree)

      return tree
    }

    const deptTree = await this.deptRepository.findTrees({
      depth: 2, // 指定查询的树的深度为 2
      relations: ['parent']
    })
    deleteEmptyChildren(deptTree)
    return deptTree
  }

  async create({ parentId, ...data }: DeptDto): Promise<void> {
    const parent = await this.deptRepository
      .createQueryBuilder('dept')
      .where({ id: parentId })
      .getOne()

    await this.deptRepository.save({
      ...data,
      // 实体定义了 就必须要传 parentEntity
      // 如果直接传递 parentId，TypeORM 无法正确识别这个 id 并建立起正确的树形关系，
      // 会导致保存的数据在树形结构关联上出现问题
      parent
    })
  }

  async info(id: number): Promise<DeptEntity> {
    const dept = await this.deptRepository
      .createQueryBuilder('dept')
      .leftJoinAndSelect('dept.parent', 'parent') // 添加 parent 属性
      .where({ id })
      .getOne()

    if (isEmpty(dept)) {
      // 部门不存在
      throw new BusinessException(ErrorEnum.DEPARTMENT_NOT_FOUND)
    }

    return dept
  }

  async update(id: number, { parentId, ...data }: DeptDto): Promise<void> {
    const item = await this.deptRepository.createQueryBuilder('dept').where({ id }).getOne()

    const parent = await this.deptRepository
      .createQueryBuilder('dept')
      .where({ id: parentId })
      .getOne()

    await this.deptRepository.save({
      ...item, // 原来的数据
      ...data, // 需要更新的数据
      parent
    })
  }

  /**
   * 根据部门查询关联的用户数量
   */
  async countUserByDeptId(id: number): Promise<number> {
    return this.userRepository.countBy({ dept: { id } })
  }

  /**
   * 查找当前部门下的子部门数量
   */
  async countChildDept(id: number): Promise<number> {
    const item = await this.deptRepository.findOneBy({ id })
    // 返回的数量包含了部门自身
    const num = await this.deptRepository.countDescendants(item)
    return num - 1
  }

  async delete(id: number): Promise<void> {
    await this.deptRepository.delete(id)
  }

  /**
   * 移动排序
   */
  async move(depts: MoveDept[]): Promise<void> {
    await this.entityManager.transaction(async manager => {
      await manager.save(depts)
    })
  }
}
