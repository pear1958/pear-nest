import { HttpException, HttpStatus } from '@nestjs/common'
import { ErrorEnum } from '../constant/error-code'
import { SUCCESS_CODE } from '../constant/response'

/**
 * 在保持 HTTP 200 状态码的前提下, 通过 自定义错误码 和 统一响应格式 处理业务异常
 */
export class BusinessException extends HttpException {
  private errorCode: number

  getErrorCode(): number {
    return this.errorCode
  }

  constructor(error: ErrorEnum | string) {
    // 如果是 ErrorEnum
    if (error.includes(':')) {
      const [code, message] = error.split(':')
      super(
        HttpException.createBody({
          code,
          message
        }),
        HttpStatus.OK
      )
      this.errorCode = Number(code)
    } else {
      super(
        HttpException.createBody({
          code: SUCCESS_CODE,
          message: error
        }),
        HttpStatus.OK
      )
      this.errorCode = SUCCESS_CODE
    }
  }
}
