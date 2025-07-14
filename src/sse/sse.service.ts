import { Injectable } from '@nestjs/common'
import { Subscriber } from 'rxjs'
import { In } from 'typeorm'
import { UserEntity } from '@/modules/system/user/user.entity'
import { RoleEntity } from '@/modules/system/role/role.entity'
import { ROOT_ROLE_ID } from '@/constant/system.constant'

export interface MessageEvent {
  data?: string | number | object
  id?: string
  type?: 'ping' | 'close' | 'updatePermsAndMenus' | 'updateOnlineUserCount'
  retry?: number
}

const clientMap: Map<number, Subscriber<MessageEvent>[]> = new Map()

@Injectable()
export class SseService {
  addClient(uid: number, subscriber: Subscriber<MessageEvent>) {
    const clients = clientMap.get(uid) || []
    clientMap.set(uid, clients.concat(subscriber))
  }

  /**
   * 移除与关闭指定端的用户(允许多端登录时的情况)
   */
  removeClient(uid: number, subscriber: Subscriber<MessageEvent>): void {
    const clients = clientMap.get(uid)
    const targetIndex = clients?.findIndex(client => client === subscriber)
    if (targetIndex !== -1) clients?.splice(targetIndex, 1).at(0)?.complete()
  }

  /** 移除与关闭指定用户的连接 */
  removeClients(uid: number): void {
    const clients = clientMap.get(uid)
    clients?.forEach(client => client?.complete())
    clientMap.delete(uid)
  }

  /** 推送给指定用户 */
  sendToClients(uid: number, data: MessageEvent): void {
    const clients = clientMap.get(uid)
    clients?.forEach(client => client?.next?.(data))
  }

  /** 推送给所有用户 */
  sendToAllUser(data: MessageEvent): void {
    clientMap.forEach((client, uid) => {
      this.sendToClients(uid, data)
    })
  }

  /**
   * 通知前端重新获取权限菜单
   */
  async noticeClientToUpdateMenusByUserIds(uid: number | number[]) {
    const userIds = [].concat(uid) as number[]
    userIds.forEach(uid => {
      this.sendToClients(uid, { type: 'updatePermsAndMenus' })
    })
  }

  /**
   * 通过roleIds通知用户更新权限菜单
   */
  async noticeClientToUpdateMenusByRoleIds(roleIds: number[]): Promise<void> {
    const users = await UserEntity.find({
      where: {
        roles: {
          id: In(roleIds)
        }
      }
    })
    if (users) {
      const userIds = users.map(n => n.id)
      await this.noticeClientToUpdateMenusByUserIds(userIds)
    }
  }

  /**
   * 通过menuIds通知用户更新权限菜单
   */
  async noticeClientToUpdateMenusByMenuIds(menuIds: number[]): Promise<void> {
    const roles = await RoleEntity.find({
      where: {
        menus: {
          id: In(menuIds)
        }
      }
    })
    const roleIds = roles.map(n => n.id).concat(ROOT_ROLE_ID)
    await this.noticeClientToUpdateMenusByRoleIds(roleIds)
  }
}
