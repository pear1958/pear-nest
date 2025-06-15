import { env, envBoolean, envNumber } from '@/utils/env'
import { ConfigType, registerAs } from '@nestjs/config'
import { DataSource, DataSourceOptions } from 'typeorm'

const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: env('DB_HOST', '127.0.0.1'),
  port: envNumber('DB_PORT', 3306),
  username: env('DB_USERNAME'),
  password: env('DB_PASSWORD'),
  database: env('DB_DATABASE'),
  // 自动同步表结构
  synchronize: envBoolean('DB_SYNCHRONIZE', false)
}

export const dbRegToken = 'database'

export const databaseConfig = registerAs(dbRegToken, (): DataSourceOptions => dataSourceOptions)

export type DatabaseConfig = ConfigType<typeof databaseConfig>

// ------------------------------------

const dataSource = new DataSource(dataSourceOptions)

export default dataSource
