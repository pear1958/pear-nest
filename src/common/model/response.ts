import { SUCCESS_CODE, SUCCESS_MSG } from '@/common/constant/response'
import { ApiProperty } from '@nestjs/swagger'

export class HttpResponse<T = any> {
  @ApiProperty({ type: 'number', default: SUCCESS_CODE })
  code: number

  @ApiProperty({ type: 'object', additionalProperties: true })
  data?: T

  @ApiProperty({ type: 'string', default: SUCCESS_MSG })
  msg: string

  constructor(code: number, data: T, msg = SUCCESS_MSG) {
    this.code = code
    this.data = data
    this.msg = msg
  }

  static success<T>(data?: T, msg?: string) {
    return new HttpResponse(SUCCESS_CODE, data, msg)
  }
  static error() {
    // xxxxxxxxxx
  }
}

export class Tree<T> {
  @ApiProperty()
  id: number

  @ApiProperty()
  parentId: number

  @ApiProperty()
  children?: Tree<T>[]
}
