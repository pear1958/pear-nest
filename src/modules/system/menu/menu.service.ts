import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { In, IsNull, Like, Not, Repository, SelectQueryBuilder } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { concat, isEmpty, isNil, uniq } from 'lodash'
import { MenuDto, MenuQueryDto, MenuType, MenuUpdateDto } from './menu.dto'
import { MenuEntity } from './menu.entity'
import { InjectRedis } from '@/common/decorator/inject-redis.decorator'
import { deleteEmptyChildren } from '@/utils/list2tree.util'
import { generateMenu, generatorRouters } from '@/utils/permission.util'
import { paginate } from '@/helper/paginate'
import { Pagination } from '@/helper/paginate/pagination'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'
import { genAuthPermKey, genAuthTokenKey } from '@/helper/genRedisKey'
import { RedisKeys } from '@/constant/cache.constant'
import { RoleService } from '../role/role.service'
import { SseService } from '@/modules/sse/sse.service'
import { MenuItemInfo } from './menu.model'

@Injectable()
export class MenuService {
  constructor(
    @InjectRedis() private redis: Redis,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
    private roleService: RoleService,
    private sseService: SseService
  ) {}

  /**
   * 获取分页菜单列表（确保数据完整，与全量查询结构一致）
   */
  async list(dto: MenuQueryDto): Promise<Pagination<MenuItemInfo> | MenuEntity[]> {
    // 1. 先查询所有符合条件的菜单数据（全量，不分页）
    const queryBuilder: SelectQueryBuilder<MenuEntity> =
      this.menuRepository.createQueryBuilder('menu')

    // 添加查询条件（保持原始方式）
    if (dto.name) {
      queryBuilder.andWhere('menu.name LIKE :name', { name: `%${dto.name}%` })
    }
    if (dto.path) {
      queryBuilder.andWhere('menu.path LIKE :path', { path: `%${dto.path}%` })
    }
    if (dto.permission) {
      queryBuilder.andWhere('menu.permission LIKE :permission', {
        permission: `%${dto.permission}%`
      })
    }
    if (dto.component) {
      queryBuilder.andWhere('menu.component LIKE :component', {
        component: `%${dto.component}%`
      })
    }
    if (dto.status !== undefined) {
      queryBuilder.andWhere('menu.status = :status', { status: dto.status })
    }

    // 获取全量数据并排序
    const allItems = await queryBuilder.orderBy('menu.orderNo', 'ASC').getMany()

    // 2. 生成完整的树形结构（与原有全量查询完全一致）
    const fullTree = generateMenu(allItems)
    deleteEmptyChildren(fullTree)

    // 3. 对树形结构的顶级节点进行分页
    const page = dto.page || 1
    const pageSize = dto.pageSize || 10
    const totalItems = fullTree.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    // 截取当前页的顶级节点（子节点完整保留）
    const currentPageItems = fullTree.slice(startIndex, endIndex)

    // 4. 返回分页结果
    return new Pagination(currentPageItems, {
      totalItems,
      itemCount: currentPageItems.length,
      itemsPerPage: pageSize,
      totalPages,
      currentPage: page
    })
  }

  /**
   * 获取所有菜单以及权限
   */
  async listNoPage({
    name,
    path,
    permission,
    component,
    status
  }: MenuQueryDto): Promise<MenuEntity[]> {
    const menus = await this.menuRepository.find({
      where: {
        ...(name && { name: Like(`%${name}%`) }),
        ...(path && { path: Like(`%${path}%`) }),
        ...(permission && { permission: Like(`%${permission}%`) }),
        ...(component && { component: Like(`%${component}%`) }),
        ...(!isNil(status) ? { status } : null)
      },
      order: { orderNo: 'ASC' }
    })

    const menuList = generateMenu(menus)

    if (!isEmpty(menuList)) {
      deleteEmptyChildren(menuList)
      return menuList
    }

    return []
  }

  async check(dto: Partial<MenuDto>): Promise<void | never> {
    // 无法在根目录下新建权限(前端传的数据基本不会走到这里)
    if (dto.type === MenuType.PERMISSION && !dto.parentId) {
      throw new BusinessException(ErrorEnum.PERMISSION_REQUIRES_PARENT)
    }

    // 菜单 & parentId 存在
    if (dto.type === MenuType.MENU && dto.parentId) {
      const parent = await this.menuRepository.findOneBy({ id: dto.parentId })

      // 前端传的数据基本不会走到这里
      if (isEmpty(parent)) {
        throw new BusinessException(ErrorEnum.PARENT_MENU_NOT_FOUND)
      }

      // 无法在 菜单 | 权限 下新建菜单
      if ([MenuType.MENU, MenuType.PERMISSION].includes(parent?.type)) {
        throw new BusinessException(ErrorEnum.ILLEGAL_OPERATION_DIRECTORY_PARENT)
      }
    }
  }

  async create(menu: MenuDto): Promise<void> {
    const result = await this.menuRepository.save(menu)
    this.sseService.noticeClientToUpdateMenusByMenuIds([result.id])
  }

  /**
   * 获取当前用户的所有权限
   */
  async getPermissions(uid: number): Promise<string[]> {
    let permission: string[] = [] // ['system:menu:list', ...]
    let sqlResult: any = null
    const roleIds = await this.roleService.getRoleIdsByUser(uid)

    // 用户有管理员角色
    if (this.roleService.hasAdminRole(roleIds)) {
      sqlResult = await this.menuRepository.findBy({
        permission: Not(IsNull()),
        type: In([MenuType.MENU_GROUP, MenuType.MENU, MenuType.PERMISSION])
      })
    } else {
      if (isEmpty(roleIds)) return []
      sqlResult = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoinAndSelect('menu.roles', 'role')
        .andWhere('role.id IN (:...roleIds)', { roleIds })
        .andWhere(`menu.type IN (${MenuType.MENU_GROUP},${MenuType.MENU},${MenuType.PERMISSION})`)
        .andWhere('menu.permission IS NOT NULL')
        .getMany()
    }

    if (!isEmpty(sqlResult)) {
      sqlResult.forEach((item: Recordable) => {
        if (item.permission) {
          permission = concat(permission, item.permission.split(','))
        }
      })
      // 去重
      permission = uniq(permission)
    }

    return permission
  }

  /**
   * 刷新所有在线用户的权限
   */
  async refreshOnlineUserPerms(isNoticeUser = true): Promise<void> {
    const onlineUserIds: string[] = await this.redis.keys(genAuthTokenKey('*'))

    if (!onlineUserIds?.length) return

    const promiseArr = onlineUserIds
      .map(i => Number.parseInt(i.split(RedisKeys.AUTH_TOKEN_PREFIX)[1]))
      .filter(i => i)
      .map(async uid => {
        const perms = await this.getPermissions(uid)
        await this.redis.set(genAuthPermKey(uid), JSON.stringify(perms))
        return uid
      })

    const uids = await Promise.all(promiseArr)
    this.sseService.noticeClientToUpdateMenusByUserIds(uids)
  }

  async update(id: number, menu: MenuUpdateDto): Promise<void> {
    await this.menuRepository.update(id, menu)
    this.sseService.noticeClientToUpdateMenusByMenuIds([id])
  }

  /**
   * 根据菜单ID查找是否有关联角色
   */
  async checkRoleByMenuId(id: number): Promise<boolean> {
    return !!(await this.menuRepository.findOne({
      where: {
        roles: {
          id
        }
      }
    }))
  }

  /**
   * 查找当前菜单下的子菜单，目录以及菜单
   */
  async findChildMenus(mid: number): Promise<any> {
    const childIdList: number[] = []
    const menus = await this.menuRepository.findBy({ parentId: mid })

    for (const menu of menus) {
      // 子目录下是菜单或目录，继续往下级查找
      if (menu.type !== MenuType.PERMISSION) {
        const c = await this.findChildMenus(menu.id)
        childIdList.push(c)
      }
      childIdList.push(menu.id)
    }

    return childIdList
  }

  /**
   * 删除多项菜单
   */
  async deleteMenuItem(mids: number[]): Promise<void> {
    await this.menuRepository.delete(mids)
  }

  /**
   * 刷新指定用户ID的权限
   */
  async refreshPerms(uid: number): Promise<void> {
    const perms = await this.getPermissions(uid)
    const online = await this.redis.get(genAuthTokenKey(uid))
    if (!online) return
    await this.redis.set(genAuthPermKey(uid), JSON.stringify(perms))
    this.sseService.noticeClientToUpdateMenusByUserIds([uid])
  }

  /**
   * 获取某个菜单以及关联的父菜单的信息
   */
  async getMenuItemAndParentInfo(mid: number) {
    const menu = await this.menuRepository.findOneBy({ id: mid })

    let parentMenu: MenuEntity | undefined

    if (menu && menu.parentId) {
      parentMenu = await this.menuRepository.findOneBy({ id: menu.parentId })
    }

    return { menu, parentMenu }
  }

  /**
   * 根据角色获取所有菜单
   */
  async getMenus(uid: number) {
    const roleIds = await this.roleService.getRoleIdsByUser(uid)
    let menus: MenuEntity[] = []

    if (isEmpty(roleIds)) return generatorRouters([])

    if (this.roleService.hasAdminRole(roleIds)) {
      menus = await this.menuRepository.find({ order: { orderNo: 'ASC' } })
    } else {
      menus = await this.menuRepository
        .createQueryBuilder('menu')
        .innerJoinAndSelect('menu.roles', 'role')
        .andWhere('role.id IN (:...roleIds)', { roleIds })
        .orderBy('menu.order_no', 'ASC')
        .getMany()
    }

    const menuList = generatorRouters(menus)
    return menuList
  }
}
