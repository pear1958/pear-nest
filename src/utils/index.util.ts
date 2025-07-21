import { customAlphabet, nanoid } from 'nanoid'

export function generateUUID(size: number = 21): string {
  return nanoid(size)
}

/**
 * 生成一个随机的值
 */
export function randomValue(
  size = 16,
  dict = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
): string {
  let id = ''
  let i = size
  const len = dict.length
  while (i--) id += dict[(Math.random() * len) | 0]
  return id
}

/**
 * 生成一个随机的值
 */
export function generateRandomValue(
  length: number,
  placeholder = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM'
): string {
  const customNanoid = customAlphabet(placeholder, length)
  return customNanoid()
}

export const uniqueSlash = (path: string) => path.replace(/(https?:\/)|(\/)+/g, '$1$2')