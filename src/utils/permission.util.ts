import { MenuEntity } from '@/modules/system/menu/menu.entity'

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
