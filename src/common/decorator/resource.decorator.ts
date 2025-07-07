import { RESOURCE_KEY } from '@/constant/auth.constant'
import { applyDecorators, SetMetadata } from '@nestjs/common'
import { ObjectLiteral, ObjectType, Repository } from 'typeorm'

export type Condition<E extends ObjectLiteral = any> = (
  Repository: Repository<E>,
  items: number[],
  user: AuthUser
) => Promise<boolean>

export interface ResourceObject {
  entity: ObjectType<any>
  condition: Condition
}

// 装饰器
export function Resource<E extends ObjectLiteral = any>(
  entity: ObjectType<E>,
  condition?: Condition<E>
) {
  return applyDecorators(SetMetadata(RESOURCE_KEY, { entity, condition }))
}
