import { SUCCESS_CODE, SUCCESS_MSG } from '@/common/constant/response'

export class HttpResponse<T = any> {
  code: number
  data?: T
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
