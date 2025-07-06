import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { isEmpty } from 'lodash'
import { RoleEntity } from './role.entity'
import { ROOT_ROLE_ID } from '@/constant/system.constant'

@Injectable()
export class RoleService {
  constructor(private roleRepository: Repository<RoleEntity>) {}

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
}
