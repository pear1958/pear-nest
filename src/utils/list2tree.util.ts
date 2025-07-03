export function deleteEmptyChildren(arr: Recordable[]) {
  arr?.forEach(node => {
    if (node.children?.length === 0) delete node.children
    else deleteEmptyChildren(node.children)
  })
}
