import { DataSource, DataSourceOptions } from 'typeorm'
import { ConfigType, registerAs } from '@nestjs/config'
import dotenv from 'dotenv'
import { env, envBoolean, envNumber } from '@/utils/env.util'

// 避免无法获取到环境变量中的值
dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: env('DB_HOST', '127.0.0.1'),
  port: envNumber('DB_PORT', 3306),
  database: env('DB_DATABASE'),
  username: env('DB_USERNAME'),
  password: env('DB_PASSWORD'),
  // 自动创建表 or 自动同步表结构  必须为 true 才能自动创建表
  synchronize: envBoolean('DB_SYNCHRONIZE', true),
  // 解决通过 pnpm migration:run 初始化数据时，遇到的 SET FOREIGN_KEY_CHECKS = 0; 等语句报错问题, 仅在执行数据迁移操作时设为 true
  // multipleStatements: currentScript === 'typeorm',
  entities: ['dist/modules/**/*.entity{.ts,.js}']
  // migrations: ['dist/migrations/*{.ts,.js}'],
  // subscribers: ['dist/modules/**/*.subscriber{.ts,.js}']
}

export const dbRegToken = 'database'

export const databaseConfig = registerAs(dbRegToken, (): DataSourceOptions => dataSourceOptions)

export type DatabaseConfig = ConfigType<typeof databaseConfig>

// ------------------------------------
// const dataSource = new DataSource(dataSourceOptions)
// export default dataSource
