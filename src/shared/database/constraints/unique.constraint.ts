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
import { isNil, merge } from 'lodash-es'

// 使用注解时传入的参数
interface Params {
  entity: ObjectType<any>
  field?: string // 如果没有指定字段则使用当前验证的属性作为查询依据
  message?: string // 验证失败的错误信息
}

/**
 * 验证某个字段的唯一性
 * name: 为验证器指定唯一名称
 * async: 声明这是一个异步验证器, 意味着 validate 方法返回 Promise, 适用于数据库查询等异步操作
 */
@ValidatorConstraint({ name: 'entityItemUnique', async: true })
@Injectable()
export class UniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    private dataSource: DataSource,
    private readonly cls: ClsService
  ) {}

  async validate(value: any, args: ValidationArguments) {
    const config = {
      field: args.property
    }

    const condition = ('entity' in args.constraints[0]
      ? merge(config, args.constraints[0])
      : {
          ...config,
          entity: args.constraints[0]
        }) as unknown as Required<Params>

    if (!condition.entity) return false

    try {
      // 查询是否存在数据,如果已经存在则验证失败
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

function IsUnique(
  entity: ObjectType<any>,
  validationOptions?: ValidationOptions
): (object: Record<string, any>, propertyName: string) => void

function IsUnique(
  condition: Params,
  validationOptions?: ValidationOptions
): (object: Record<string, any>, propertyName: string) => void

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
