const prefix = 'm-shop'

export function getRedisKey(key: string, ...concatKeys: string[]) {
  return `${prefix}:${key}${concatKeys?.length ? `:${concatKeys.join('_')}` : ''}`
}
