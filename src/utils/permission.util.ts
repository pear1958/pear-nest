import { MenuEntity } from '@/modules/system/menu/menu.entity'
import { isExternal } from './is.util'
import { uniqueSlash } from './index.util'

export interface RouteRecordRaw {
  id: number
  path: string
  name: string
  component?: string
  redirect?: string
  meta: {
    title: string
    icon: string
    isExt: boolean
    extOpenMode: number
    type: number
    orderNo: number
    show: number
    activeMenu: string
    status: number
    keepAlive: number
  }
  children?: RouteRecordRaw[]
}

// 菜单类型 菜单(0) 目录(1) 权限(2)

function filterMenuToTable(menus: MenuEntity[], parentMenu) {
  const res = []

  menus.forEach(menu => {
    // 根级别菜单渲染
    let realMenu

    if (!parentMenu && !menu.parentId && menu.type === 1) {
      // 根菜单，查找该跟菜单下子菜单，因为可能会包含权限
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    } else if (!parentMenu && !menu.parentId && menu.type === 0) {
      // 根目录
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    } else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 1) {
      // 子菜单下继续找是否有子菜单
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    } else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 0) {
      // 如果还是目录，继续递归
      const childMenu = filterMenuToTable(menus, menu)
      realMenu = { ...menu }
      realMenu.children = childMenu
    } else if (parentMenu && parentMenu.id === menu.parentId && menu.type === 2) {
      realMenu = { ...menu }
    }

    // add curent route
    if (realMenu) {
      realMenu.pid = menu.id
      res.push(realMenu)
    }
  })

  return res
}

export function generateMenu(menu: MenuEntity[]) {
  return filterMenuToTable(menu, null)
}

export function generatorRouters(menus: MenuEntity[]) {
  return filterAsyncRoutes(menus, null)
}

function createRoute(menu: MenuEntity, _isRoot: boolean): RouteRecordRaw {
  const commonMeta: RouteRecordRaw['meta'] = {
    title: menu.name,
    icon: menu.icon,
    isExt: menu.isExt,
    extOpenMode: menu.extOpenMode,
    type: menu.type,
    orderNo: menu.orderNo,
    show: menu.show,
    activeMenu: menu.activeMenu,
    status: menu.status,
    keepAlive: menu.keepAlive
  }

  if (isExternal(menu.path)) {
    return {
      id: menu.id,
      path: menu.path,
      // component: 'IFrame',
      name: menu.name,
      meta: { ...commonMeta }
    }
  }

  // 目录
  if (menu.type === 0) {
    return {
      id: menu.id,
      path: menu.path,
      component: menu.component,
      name: menu.name,
      meta: { ...commonMeta }
    }
  }

  return {
    id: menu.id,
    path: menu.path,
    name: menu.name,
    component: menu.component,
    meta: {
      ...commonMeta
    }
  }
}

function filterAsyncRoutes(menus: MenuEntity[], parentRoute: MenuEntity): RouteRecordRaw[] {
  const res: RouteRecordRaw[] = []

  menus.forEach(menu => {
    if (menu.type === 2 || !menu.status) {
      // 如果是权限或禁用直接跳过
      return
    }
    // 根级别菜单渲染
    let realRoute: RouteRecordRaw

    const genFullPath = (path: string, parentPath) => {
      return uniqueSlash(path.startsWith('/') ? path : `/${parentPath}/${path}`)
    }

    if (!parentRoute && !menu.parentId && menu.type === 1) {
      // 根菜单
      realRoute = createRoute(menu, true)
    } else if (!parentRoute && !menu.parentId && menu.type === 0) {
      // 目录
      const childRoutes = filterAsyncRoutes(menus, menu)
      realRoute = createRoute(menu, true)
      if (childRoutes && childRoutes.length > 0) {
        realRoute.redirect = genFullPath(childRoutes[0].path, realRoute.path)
        realRoute.children = childRoutes
      }
    } else if (parentRoute && parentRoute.id === menu.parentId && menu.type === 1) {
      // 子菜单
      realRoute = createRoute(menu, false)
    } else if (parentRoute && parentRoute.id === menu.parentId && menu.type === 0) {
      // 如果还是目录，继续递归
      const childRoutes = filterAsyncRoutes(menus, menu)
      realRoute = createRoute(menu, false)
      if (childRoutes && childRoutes.length > 0) {
        realRoute.redirect = genFullPath(childRoutes[0].path, realRoute.path)
        realRoute.children = childRoutes
      }
    }
    // add curent route
    if (realRoute) res.push(realRoute)
  })
  return res
}
