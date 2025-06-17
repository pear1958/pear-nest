import { Logger } from '@nestjs/common'
import { LoggerOptions, Logger as TypeORMLogger, QueryRunner } from 'typeorm'

export class CustomORMLogger implements TypeORMLogger {
  private logger = new Logger(CustomORMLogger.name)

  constructor(private options: LoggerOptions) {}

  private isEnable(
    level: 'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration'
  ): boolean {
    return (
      this.options === 'all' ||
      this.options === true ||
      (Array.isArray(this.options) && this.options.includes(level))
    )
  }

  private stringify(parameters: any[]) {
    try {
      return JSON.stringify(parameters)
    } catch (error) {
      return parameters
    }
  }

  // 记录数据库查询语句
  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    if (!this.isEnable('query')) return
    const hasParam = parameters && parameters.length
    // 构建完整的 SQL 语句, 包含参数信息
    const sql = query + (hasParam ? ` -- PARAMETERS: ${this.stringify(parameters)}` : '')
    this.logger.log(`[QUERY]: ${sql}`)
  }

  // 记录失败的查询
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner
  ) {
    if (!this.isEnable('error')) return
    const hasParam = parameters && parameters.length
    const sql = query + (hasParam ? ` -- PARAMETERS: ${this.stringify(parameters)}` : '')
    this.logger.error([`[FAILED QUERY]: ${sql}`, `[QUERY ERROR]: ${error}`])
  }

  // 记录缓慢的查询
  logQuerySlow(time: number, query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    const hasParam = parameters && parameters.length
    const sql = query + (hasParam ? ` -- PARAMETERS: ${this.stringify(parameters)}` : '')
    this.logger.warn(`[SLOW QUERY: ${time} ms]: ${sql}`)
  }

  // 记录数据库架构构建信息
  logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
    if (!this.isEnable('schema')) return
    this.logger.log(message)
  }

  // 记录数据库迁移信息
  logMigration(message: string, _queryRunner?: QueryRunner) {
    if (!this.isEnable('migration')) return
    this.logger.log(message)
  }

  // 通用日志记录方法, 处理不同级别的日志
  log(level: 'warn' | 'info' | 'log', message: any, _queryRunner?: QueryRunner) {
    if (!this.isEnable(level)) return

    switch (level) {
      case 'log':
        this.logger.debug(message)
        break
      case 'info':
        this.logger.log(message)
        break
      case 'warn':
        this.logger.warn(message)
        break
      default:
        break
    }
  }
}
