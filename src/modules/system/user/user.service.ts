import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { EntityManager, In, Like, Repository } from 'typeorm'
import { isEmpty, isNil } from 'lodash'
import { menuList } from '@/mock/menuList'
import { UserEntity } from './user.entity'
import { UserDto, UserQueryDto, UserUpdateDto } from './dto/user.dto'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { randomValue } from '@/utils/index.util'
import { md5 } from '@/utils/crypto.util'
import { ParamConfigService } from '../param-config/param-config.service'
import { ROOT_ROLE_ID, SYS_USER_INITPASSWORD } from '@/constant/system.constant'
import { RegisterDto } from '@/modules/auth/dto/auth.dto'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import Redis from 'ioredis'
import {
  genAuthPVKey,
  genAuthPermKey,
  genAuthTokenKey,
  genOnlineUserKey
} from '@/helper/genRedisKey'
import { AccessTokenEntity } from '@/modules/auth/entities/access-token.entity'
import { AccountInfo } from './user.model'
import { AccountUpdateDto } from '@/modules/auth/dto/account.dto'
import { PasswordUpdateDto } from './dto/password.dto'
import { Pagination } from '@/helper/paginate/pagination'
import { paginate } from '@/helper/paginate'
import { RoleEntity } from '../role/role.entity'

enum UserStatus {
  Disable = 0,
  Enabled = 1
}

@Injectable()
export class UserService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectEntityManager() private entityManager: EntityManager,
    private readonly paramConfigService: ParamConfigService,
    @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>
  ) {}

  /**
   * 增加系统用户, 如果返回 false 则表示已存在该用户
   */
  async create({ username, password, roleIds, deptId, ...data }: UserDto): Promise<void> {
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
        psalt: salt,
        roles: await this.roleRepository.findBy({ id: In(roleIds) })
        // dept: await DeptEntity.findOneBy({ id: deptId }),
      })

      const result = await manager.save(user)

      return result
    })
  }

  /**
   * 注册
   */
  async register({ username, ...data }: RegisterDto): Promise<void> {
    const exists = await this.userRepository.findOneBy({
      username
    })

    if (!isEmpty(exists)) {
      throw new BusinessException(ErrorEnum.SYSTEM_USER_EXISTS)
    }

    // 这些操作要么全部成功执行，要么全部失败回滚
    // UserEntity 存在 级联操作（如自动保存关联实体）
    await this.entityManager.transaction(async manager => {
      const salt = randomValue(32)
      const password = md5(`${data.password ?? 'a123456'}${salt}`)
      const u = manager.create(UserEntity, {
        username,
        password,
        status: 1,
        psalt: salt
      })
      const user = await manager.save(u)
      return user
    })
  }

  /**
   * 禁用用户
   */
  async forbidden(uid: number, accessToken?: string): Promise<void> {
    await this.redis.del(genAuthPVKey(uid))
    await this.redis.del(genAuthTokenKey(uid))
    await this.redis.del(genAuthPermKey(uid))
    if (accessToken) {
      const token = await AccessTokenEntity.findOne({
        where: { value: accessToken }
      })
      this.redis.del(genOnlineUserKey(token.id))
    }
  }

  /**
   * 禁用多个用户
   */
  async multiForbidden(uids: number[]): Promise<void> {
    if (uids) {
      const pvs: string[] = []
      const ts: string[] = []
      const ps: string[] = []
      uids.forEach(uid => {
        pvs.push(genAuthPVKey(uid))
        ts.push(genAuthTokenKey(uid))
        ps.push(genAuthPermKey(uid))
      })
      await this.redis.del(pvs)
      await this.redis.del(ts)
      await this.redis.del(ps)
    }
  }

  /**
   * 获取用户信息
   * @param uid user id
   */
  async getAccountInfo(uid: number): Promise<AccountInfo> {
    const user: UserEntity = await this.userRepository
      .createQueryBuilder('user') // 创建用于构建 SQL 查询的查询构建器
      .leftJoinAndSelect('user.roles', 'role') // role别名 后续处理关联数据时使用
      .where(`user.id = :uid`, { uid })
      .getOne()

    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)
    }
    delete user?.psalt
    return user
  }

  /**
   * 更新个人信息
   */
  async updateAccountInfo(uid: number, info: AccountUpdateDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })

    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)
    }

    const data = {
      ...(info.nickname ? { nickname: info.nickname } : null),
      ...(info.avatar ? { avatar: info.avatar } : null),
      ...(info.email ? { email: info.email } : null),
      ...(info.phone ? { phone: info.phone } : null),
      ...(info.qq ? { qq: info.qq } : null),
      ...(info.remark ? { remark: info.remark } : null)
    }

    // to-do

    await this.userRepository.update(uid, data)
  }

  /**
   * 升级用户版本密码
   */
  async upgradePasswordV(id: number): Promise<void> {
    const key = genAuthPVKey(id)
    const version = await this.redis.get(key) // admin:passwordVersion:${param.id}
    if (!isEmpty(version)) {
      await this.redis.set(key, Number.parseInt(version) + 1)
    }
  }

  /**
   * 更改密码
   */
  async updatePassword(uid: number, dto: PasswordUpdateDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })

    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.USER_NOT_FOUND)
    }

    // 原密码不一致，不允许更改
    if (user.password !== md5(`${dto.oldPassword}${user.psalt}`)) {
      throw new BusinessException(ErrorEnum.PASSWORD_MISMATCH)
    }

    const password = md5(`${dto.newPassword}${user.psalt}`)

    await this.userRepository.update({ id: uid }, { password })

    await this.upgradePasswordV(user.id)
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

  /**
   * 查询用户列表
   */
  async list({
    page,
    pageSize,
    username,
    nickname,
    deptId,
    email,
    status
  }: UserQueryDto): Promise<Pagination<UserEntity>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.dept', 'dept')
      .leftJoinAndSelect('user.roles', 'role')
      // .where('user.id NOT IN (:...ids)', { ids: [rootUserId, uid] })
      .where({
        ...(username ? { username: Like(`%${username}%`) } : null),
        ...(nickname ? { nickname: Like(`%${nickname}%`) } : null),
        ...(email ? { email: Like(`%${email}%`) } : null),
        ...(!isNil(status) ? { status } : null)
      })

    if (deptId) queryBuilder.andWhere('dept.id = :deptId', { deptId })

    return paginate<UserEntity>(queryBuilder, {
      page,
      pageSize
    })
  }

  /**
   * 查找用户信息
   * @param id 用户id
   */
  async info(id: number): Promise<UserEntity> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.dept', 'dept')
      .where('user.id = :id', { id })
      .getOne()
    delete user.password
    delete user.psalt
    return user
  }

  /**
   * 直接更改密码
   */
  async forceUpdatePassword(uid: number, password: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: uid })
    const newPassword = md5(`${password}${user.psalt}`)
    await this.userRepository.update({ id: uid }, { password: newPassword })
    await this.upgradePasswordV(user.id)
  }

  /**
   * 更新用户信息
   */
  async update(
    id: number,
    { password, deptId, roleIds, status, ...data }: UserUpdateDto
  ): Promise<void> {
    await this.entityManager.transaction(async manager => {
      if (password) {
        await this.forceUpdatePassword(id, password)
      }

      await manager.update(UserEntity, id, {
        ...data,
        status
      })

      const user = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'roles')
        .leftJoinAndSelect('user.dept', 'dept')
        .where('user.id = :id', { id })
        .getOne()

      if (roleIds) {
        await manager
          .createQueryBuilder()
          .relation(UserEntity, 'roles')
          .of(id)
          .addAndRemove(roleIds, user.roles)
      }

      if (deptId) {
        await manager.createQueryBuilder().relation(UserEntity, 'dept').of(id).set(deptId)
      }

      // 禁用状态
      if (status === UserStatus.Disable) {
        await this.forbidden(id)
      }
    })
  }

  /**
   * 查找超管的用户ID
   */
  async findRootUserId(): Promise<number> {
    const user = await this.userRepository.findOneBy({
      roles: { id: ROOT_ROLE_ID }
    })
    return user.id
  }

  /**
   * 根据ID列表删除用户
   */
  async delete(userIds: number[]): Promise<void | never> {
    const rootUserId = await this.findRootUserId()
    if (userIds.includes(rootUserId)) {
      throw new BadRequestException('不能删除root用户!')
    }
    await this.userRepository.delete(userIds)
  }
}
