import { ConfigKeyPaths } from '@/config'
import { ConsoleLogger, ConsoleLoggerOptions, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { config, createLogger, format, transports, type Logger } from 'winston'
import 'winston-daily-rotate-file'

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose'
}

@Injectable()
// 扩展内置Logger
export class LoggerService extends ConsoleLogger {
  private winstonLogger: Logger

  // context 和 options 这两个参数是在模块注册 LoggerService 时通过工厂函数手动提供的
  constructor(
    context: string,
    options: ConsoleLoggerOptions,
    private configService: ConfigService<ConfigKeyPaths>
  ) {
    super(context, options)
    this.initWinston()
  }

  protected get level(): LogLevel {
    return this.configService.get('app.logger.level') as LogLevel
  }

  protected get maxFiles(): number {
    return this.configService.get('app.logger.maxFiles')!
  }

  protected initWinston(): void {
    this.winstonLogger = createLogger({
      levels: config.npm.levels,
      format: format.combine(format.errors({ stack: true }), format.timestamp(), format.json()),
      transports: [
        new transports.DailyRotateFile({
          level: this.level,
          filename: 'logs/app.%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: this.maxFiles,
          format: format.combine(format.timestamp(), format.json()),
          auditFile: 'logs/.audit/app.json'
        }),
        new transports.DailyRotateFile({
          level: LogLevel.ERROR,
          filename: 'logs/app-error.%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: this.maxFiles,
          format: format.combine(format.timestamp(), format.json()),
          auditFile: 'logs/.audit/app-error.json'
        })
      ]
    })
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
