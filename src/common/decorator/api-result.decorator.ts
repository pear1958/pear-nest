import { HttpStatus, RequestMethod, Type, applyDecorators } from '@nestjs/common'
import { METHOD_METADATA } from '@nestjs/common/constants'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import { HttpResponse } from '../model/response.model'

interface Params<T> {
  type?: T | T[]
  isPage?: boolean
  status?: HttpStatus
}

// 基础类型名称列表, 用于判断是否为原始类型
const baseTypeNames = ['String', 'Number', 'Boolean']

const genBaseProp = (type: Type<any>) => {
  if (baseTypeNames.includes(type.name)) {
    return { type: type.name.toLocaleLowerCase() }
  } else {
    return { $ref: getSchemaPath(type) }
  }
}

/**
 * 自动生成 NestJS API 的 Swagger 文档
 * Type: 表示可以被实例化的类
 */
export function ApiResult<T extends Type<any>>(params: Params<T>) {
  const { type, isPage, status } = params
  let prop = null

  // 根据type参数的不同情况生成不同的响应模式
  if (Array.isArray(type)) {
    // 处理分页数据（包含items和meta信息）
    if (isPage) {
      prop = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: getSchemaPath(type[0]) }
          },
          meta: {
            type: 'object',
            properties: {
              itemCount: { type: 'number', default: 0 },
              totalItems: { type: 'number', default: 0 },
              itemsPerPage: { type: 'number', default: 0 },
              totalPages: { type: 'number', default: 0 },
              currentPage: { type: 'number', default: 0 }
            }
          }
        }
      }
    } else {
      prop = {
        type: 'array',
        items: genBaseProp(type[0])
      }
    }
  } else if (type) {
    // 处理单一对象
    prop = genBaseProp(type)
  } else {
    // 处理无返回数据的情况
    prop = { type: 'null', default: null }
  }

  const model = Array.isArray(type) ? type[0] : type

  return applyDecorators(
    ApiExtraModels(model),
    (target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
      queueMicrotask(() => {
        const isPost = Reflect.getMetadata(METHOD_METADATA, descriptor.value) === RequestMethod.POST

        ApiResponse({
          status: status ?? (isPost ? HttpStatus.CREATED : HttpStatus.OK),
          schema: {
            allOf: [
              { $ref: getSchemaPath(HttpResponse) },
              {
                properties: {
                  data: prop
                }
              }
            ]
          }
        })(target, key, descriptor)
      })
    }
  )
}
