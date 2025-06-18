import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { QueryFailedError } from 'typeorm'
import { FastifyReply, FastifyRequest } from 'fastify'
import { BusinessException } from '../exception/business'
import { isDev } from '@/utils/env'
import { ErrorEnum } from '../constant/error-code'

interface CustomError {
  readonly status: number
  readonly statusCode?: number
  readonly message?: string
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name)

  constructor() {
    this.registerCatchAllExceptionHook()
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<FastifyRequest>()
    const response = ctx.getResponse<FastifyReply>()
    const status = this.getStatus(exception)
    let message = this.getErrorMessage(exception)
    const url = request.raw.url!

    // 系统内部错误时
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && !(exception instanceof BusinessException)) {
      // 对象类型可以优化 to-do
      Logger.error(exception, undefined, 'Catch')
      // 生产环境下隐藏错误信息
      if (!isDev) message = ErrorEnum.SERVER_ERROR?.split(':')[1]
    } else {
      // 自动使用类名作为上下文
      this.logger.warn(`错误信息：(${status}) ${message} Path: ${decodeURI(url)}`)
    }

    const code = exception instanceof BusinessException ? exception.getErrorCode() : status

    // 返回基础响应结果
    const result: BaseResponse = {
      code,
      message,
      data: null
    }

    response.status(status).send(result)
  }

  registerCatchAllExceptionHook() {
    process.on('unhandledRejection', reason => {
      console.error('unhandledRejection: ', reason)
    })

    process.on('uncaughtException', err => {
      console.error('uncaughtException: ', err)
    })
  }

  getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus()
    } else if (exception instanceof QueryFailedError) {
      // 数据库异常
      return HttpStatus.INTERNAL_SERVER_ERROR
    } else {
      return (
        (exception as CustomError)?.status ??
        (exception as CustomError)?.statusCode ??
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.message
    } else if (exception instanceof QueryFailedError) {
      return exception.message
    } else {
      return (
        (exception as any)?.response?.message ??
        (exception as CustomError)?.message ??
        `${exception}`
      )
    }
  }
}
