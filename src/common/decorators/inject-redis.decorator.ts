import { Inject } from '@nestjs/common'

/**
 * 在 NestJS 中，依赖注入通常通过类名或接口进行
 * 但对于非类的提供者（如第三方库实例、配置对象等），需要使用自定义令牌来标识它们
 * 也就是 @Inject('令牌名')
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT')

// 装饰器工厂(返回装饰器) === @Inject(REDIS_CLIENT)
// 自定义装饰器: 封装 Inject 并使用 REDIS_CLIENT 令牌
export const InjectRedis = () => Inject(REDIS_CLIENT)
