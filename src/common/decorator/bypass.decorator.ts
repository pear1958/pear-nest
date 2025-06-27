import { SetMetadata } from '@nestjs/common'

export const BYPASS_KEY = Symbol('__bypass_key__')

/**
 * 1.元数据装饰器（SetMetadata）
 * 2.组合装饰器（applyDecorators）
 * 3.参数装饰器（createParamDecorator）
 * 4.函数式装饰器
 * 5.类装饰器
 * 6.装饰器工厂: 动态生成装饰器
 * 7.混合装饰器：同时支持类和方法
 */

/**
 * 当不需要转换成基础返回格式时添加该装饰器
 * 使用方式参考 transform.interceptor.ts
 */
export function Bypass() {
  return SetMetadata(BYPASS_KEY, true)
}
