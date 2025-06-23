import { HttpException, HttpStatus } from '@nestjs/common'
import { ErrorEnum } from '../../constant/error-code.constant'
import { SUCCESS_CODE } from '../../constant/response.constant'

// 比如返回给前端的数据格式为:
// {
//   code: 1105,
//   message: "您的账号已在其他地方登录",
//   data: null
// }

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
          code, // 业务错误码 exception.getStatus() 时会获取到
          message // 业务错误信息
        }),
        // http状态码 200 -> response.status(status) 时会获取到
        HttpStatus.OK
      )
      // 设置返回给前端的code
      this.errorCode = Number(code)
    } else {
      super(
        HttpException.createBody({
          code: SUCCESS_CODE, // 200
          message: error // 自定义字符串
        }),
        HttpStatus.OK
      )
      this.errorCode = SUCCESS_CODE
    }
  }
}
