import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import {
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions
} from 'class-validator'
import { DataSource, Not, ObjectType } from 'typeorm'
import { isNil, merge } from 'lodash'

// 使用注解时传入的参数
interface Params {
  entity: ObjectType<any>
  field?: string // 如果没有指定字段则使用当前验证的属性作为查询依据
  message?: string // 验证失败的错误信息
}

/**
 * 自定义验证逻辑
 * name: 为验证器指定唯一名称 args.constraints[0].name 可以访问
 * async: 声明这是一个异步验证器, 意味着 validate 方法返回 Promise, 适用于数据库查询等异步操作
 */
@ValidatorConstraint({ name: 'entityItemUnique', async: true })
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    private dataSource: DataSource,
    private readonly cls: ClsService
  ) {}

  // 如果验证成功，则 method 返回 true，否则返回 false
  async validate(value: any, args: ValidationArguments) {
    const config = {
      field: args.property // 当前被验证的类属性名
    }

    // args.constraints[0]：装饰器传入的参数
    // 即 @IsUnique(UserEntity) 或 @IsUnique({ entity: UserEntity, field: 'email' }) 中的参数
    const condition = ('entity' in args.constraints[0]
      ? merge(config, args.constraints[0])
      : {
          ...config,
          entity: args.constraints[0]
        }) as unknown as Required<Params>

    if (!condition.entity) return false

    try {
      const repo = this.dataSource.getRepository(condition.entity)

      // 如果没有传自定义的错误信息，则尝试获取该字段的 comment 作为信息提示
      if (!condition.message) {
        const targetColumn = repo.metadata.columns.find(n => n.propertyName === condition.field)
        if (targetColumn?.comment) {
          args.constraints[0].message = `已存在相同的${targetColumn.comment}`
        }
      }

      const operateId = this.cls.get('operateId')

      // 在查询时排除指定 ID 的记录 eg: 编辑操作, 排除自身
      const andWhere = Number.isInteger(operateId) ? { id: Not(operateId) } : {}

      // 查询是否存在数据, 如果已经存在则验证失败
      const res = await repo.findOne({
        where: { [condition.field]: value, ...andWhere }
      })

      return isNil(res)
    } catch (err) {
      // 如果数据库操作异常则验证失败
      return false
    }
  }

  defaultMessage(args: ValidationArguments) {
    const { entity, field, message } = args.constraints[0] as Params
    const queryProperty = field ?? args.property
    if (!entity) return 'Model not been specified!'
    if (message) return message
    return `${queryProperty} of ${entity.name} must been unique!`
  }
}

/**
 * @param {ObjectType} params
 * 方式一：直接传入实体类 @IsUnique(UserEntity)
 * 方式二：传入配置对象 @IsUnique({ entity: UserEntity, field: 'email' })
 */
function IsUnique(params: ObjectType<any> | Params, validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [params],
      validator: UniqueConstraint
    })
  }
}

export { IsUnique }
