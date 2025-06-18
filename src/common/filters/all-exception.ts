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
    const url = request.raw.url!
    const isBusinessException = exception instanceof BusinessException
    let message = this.getErrorMessage(exception)

    // 记录日志
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && !isBusinessException) {
      // 对象类型可以优化 to-do
      Logger.error(exception, undefined, 'Catch')
      // 生产环境下隐藏错误信息
      if (!isDev) message = ErrorEnum.SERVER_ERROR?.split(':')[1]
    } else {
      // 自动使用类名作为上下文
      this.logger.warn(`错误信息：(${status}) ${message} Path: ${decodeURI(url)}`)
    }

    const code = !isBusinessException ? status : exception.getErrorCode()

    // 返回基础响应结果
    const result: BaseResponse = {
      code,
      message,
      data: null
    }

    response.status(status).send(result)
  }

  // 全局捕获 Node.js 应用中未被处理的异常, 防止这些异常导致应用崩溃
  registerCatchAllExceptionHook() {
    // 当同步代码抛出错误, 未被 try-catch 捕获时
    process.on('uncaughtException', err => {
      console.error('uncaughtException: ', err)
    })
    // 当 Promise 被拒绝, 但未 catch 处理时
    process.on('unhandledRejection', reason => {
      console.error('unhandledRejection: ', reason)
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
