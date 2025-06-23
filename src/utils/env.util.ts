import cluster from 'node:cluster'

// 判断当前进程是否为 PM2 集群模式下的主进程
// process.env.NODE_APP_INSTANCE是 PM2 提供的环境变量, 主进程的该变量值为0, 子进程的值则为1、2等
export const isMainCluster =
  process.env.NODE_APP_INSTANCE && Number.parseInt(process.env.NODE_APP_INSTANCE) === 0

// 当使用 Node.js 的cluster模块时, 主进程的该属性为true
export const isMainProcess = cluster.isPrimary || isMainCluster

export const isDev = process.env.NODE_ENV === 'development'

export type BaseType = boolean | number | string | undefined | null

/**
 * 格式化环境变量
 * @param key 环境变量的键值
 * @param defaultValue 默认值
 * @param callback 格式化函数
 */
function formatValue<T extends BaseType = string>(
  key: string,
  defaultValue: T,
  callback?: (value: string) => T
): T {
  const value: string | undefined = process.env[key]
  if (typeof value === 'undefined') return defaultValue
  if (!callback) return value as unknown as T
  return callback(value)
}

export function env(key: string, defaultValue: string = '') {
  return formatValue(key, defaultValue)
}

export function envString(key: string, defaultValue: string = '') {
  return formatValue(key, defaultValue)
}

export function envNumber(key: string, defaultValue: number = 0) {
  return formatValue(key, defaultValue, value => {
    try {
      return Number(value)
    } catch {
      throw new Error(`${key} environment variable is not a number`)
    }
  })
}

export function envBoolean(key: string, defaultValue: boolean = false) {
  return formatValue(key, defaultValue, value => {
    try {
      return Boolean(JSON.parse(value))
    } catch {
      throw new Error(`${key} environment variable is not a boolean`)
    }
  })
}
