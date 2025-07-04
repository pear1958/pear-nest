import { PERMISSION_KEY } from '@/constant/auth.constant'
import { applyDecorators, SetMetadata } from '@nestjs/common'
import { isPlainObject } from 'lodash'

// 资源操作需要特定的权限
export function Perm(permission: string | string[]) {
  return applyDecorators(SetMetadata(PERMISSION_KEY, permission))
}

// (此举非必需)保存通过 definePermission 定义的所有权限
// 可用于前端开发人员开发阶段的 ts 类型提示，避免前端权限定义与后端定义不匹配
let permissions: string[] = []

export function definePermission(modulePrefix: string, actions: any) {
  // const permissions = definePermission('system:menu', {
  //   LIST: 'list',
  //   CREATE: 'create',
  //   READ: 'read',
  //   UPDATE: 'update',
  //   DELETE: 'delete'
  // } as const)
  if (isPlainObject(actions)) {
    Object.entries(actions).forEach(([key, action]) => {
      actions[key] = `${modulePrefix}:${action}`
    })
    permissions = [...new Set([...permissions, ...Object.values<string>(actions)])]
    return actions
  }

  // definePermission('system:online', ['list', 'kick'] as const)
  if (Array.isArray(actions)) {
    const permissionFormats = actions.map(action => `${modulePrefix}:${action}`)
    permissions = [...new Set([...permissions, ...permissionFormats])]

    return actions.reduce((prev, action) => {
      // 属性名必须是大写
      prev[action.toUpperCase()] = `${modulePrefix}:${action}`
      return prev
    }, {})
  }
}

// 获取所有通过 definePermission 定义的权限
export const getDefinePermissions = () => permissions
