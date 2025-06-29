import { Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { isEmpty } from 'lodash-es'
import { menuList } from '@/mock/menuList'
import { UserEntity } from './user.entity'
import { UserDto } from './dto/user.dto'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { randomValue } from '@/utils/index.util'
import { md5 } from '@/utils/crypto.util'
import { ParamConfigService } from '../system/param-config/param-config.service'
import { SYS_USER_INITPASSWORD } from '@/constant/system.constant'

enum UserStatus {
  Disable = 0,
  Enabled = 1
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectEntityManager() private entityManager: EntityManager,
    private readonly paramConfigService: ParamConfigService
  ) {}

  /**
   * 增加系统用户, 如果返回 false 则表示已存在该用户
   */
  async create({
    username,
    password,
    // roleIds,
    deptId,
    ...data
  }: UserDto): Promise<void> {
    const existed = await this.userRepository.findOneBy({
      username
    })

    // 用户已存在
    if (!isEmpty(existed)) {
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)
    }

    await this.entityManager.transaction(async manager => {
      const salt = randomValue(32)

      if (!password) {
        const initPassword = await this.paramConfigService.findValueByKey(SYS_USER_INITPASSWORD)
        password = md5(`${initPassword ?? 'a123456'}${salt}`)
      } else {
        password = md5(`${password ?? 'a123456'}${salt}`)
      }

      const user = manager.create(UserEntity, {
        username,
        password,
        ...data,
        psalt: salt
        // roles: await this.roleRepository.findBy({ id: In(roleIds) }),
        // dept: await DeptEntity.findOneBy({ id: deptId }),
      })

      const result = await manager.save(user)

      return result
    })
  }

  findAll() {
    return menuList
  }

  getUserInfo() {
    return {
      userName: 'Admin',
      mobile: '18270993095',
      apartment: 'IT服务部',
      avatar: 'xxx',
      salary: 4500
    }
  }

  getAuthButton() {
    return {
      home: ['test1', 'add', 'delete', 'edit', 'query', '一键导出', '一键删除'],
      jsonForm: ['设备列表1', '设备列表2'],
      jsonTable: ['add', 'delete', 'query', 'salary']
    }
  }

  async findUserByUserName(username: string): Promise<UserEntity | undefined> {
    return this.userRepository
      .createQueryBuilder('user')
      .where({
        username,
        status: UserStatus.Enabled
      })
      .getOne()
  }
}
