import { ConsoleLogger, Injectable } from '@nestjs/common'
import type { Logger } from 'winston'

import 'winston-daily-rotate-file'

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose'
}

@Injectable()
export class LoggerService extends ConsoleLogger {
  private winstonLogger: Logger

  protected initWinston(): void {
    // xxxxxxxxx
  }

  verbose(message: any, context?: string): void {
    // 调用父类方法输出到控制台
    super.verbose.apply(this, [message, context])
    // 写入日志文件
    this.winstonLogger.log(LogLevel.VERBOSE, message, { context })
  }

  debug(message: any, context?: string): void {
    super.debug.apply(this, [message, context])
    this.winstonLogger.log(LogLevel.DEBUG, message, { context })
  }

  log(message: any, context?: string): void {
    super.log.apply(this, [message, context])
    this.winstonLogger.log(LogLevel.INFO, message, { context })
  }

  warn(message: any, context?: string): void {
    super.warn.apply(this, [message, context])
    this.winstonLogger.log(LogLevel.WARN, message)
  }

  error(message: any, stack?: string, context?: string): void {
    super.error.apply(this, [message, stack, context])
    const hasStack = !!context
    this.winstonLogger.log(LogLevel.ERROR, {
      context: hasStack ? context : stack,
      message: hasStack ? new Error(message) : message
    })
  }
}
