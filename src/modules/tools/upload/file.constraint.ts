import { FastifyMultipartBaseOptions, MultipartFile } from '@fastify/multipart'
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'
import { has, isArray } from 'lodash'

// 定义文件限制的类型，包含文件大小、文件数量和允许的文件类型
type FileLimit = Pick<FastifyMultipartBaseOptions['limits'], 'fileSize' | 'files'> & {
  mimetypes?: string[]
}

function checkFileAndLimit(file: MultipartFile, limits: FileLimit = {}) {
  // 检查文件对象是否包含 mimetype 属性
  if (!('mimetype' in file)) return false

  // 检查文件的 mimetype 是否在允许的 mimetypes 列表中
  if (limits.mimetypes && !limits.mimetypes.includes(file.mimetype)) return false

  // 检查文件的大小是否超过限制
  if (has(file, '_buf') && Buffer.byteLength((file as any)._buf) > limits.fileSize) {
    return false
  }

  return true
}

@ValidatorConstraint({ name: 'isFile' })
export class FileConstraint implements ValidatorConstraintInterface {
  validate(value: MultipartFile, args: ValidationArguments) {
    // 第一个参数为 limits
    const [limits = {}] = args.constraints

    // 获取要验证的对象中的属性值 即 file 的值
    const values = (args.object as any)[args.property]

    const filesLimit = (limits as FileLimit).files ?? 0

    // 检查文件数量是否超过限制
    if (filesLimit > 0 && isArray(values) && values.length > filesLimit) {
      return false
    }

    // 检查 mimetype 和 文件的大小
    return checkFileAndLimit(value, limits)
  }

  defaultMessage(_args: ValidationArguments) {
    return '上传文件的条件不满足'
  }
}

/**
 * 图片验证规则
 * @param limits 限制选项
 * @param validationOptions class-validator选项
 */
export function IsFile(limits?: FileLimit, validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [limits],
      validator: FileConstraint
    })
  }
}
