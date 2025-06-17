import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { DatabaseConfig } from '@/config/database'
import { env } from '@/utils/env'
import { ConfigKeyPaths } from '@/config'
import { CustomORMLogger } from './custom-orm-logger'
import { UniqueConstraint } from './constraints/unique'

const providers = [UniqueConstraint]

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // 注入依赖服务
      inject: [ConfigService],
      // 动态生成 TypeORM 的连接配置对象
      // 需要从环境变量、配置文件或其他服务中获取数据库配置时使用
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        const dbLogging = JSON.parse(env('DB_LOGGING'))
        // 必须设置 dotenv 否则拿不到
        const dbConfig = configService.get<DatabaseConfig>('database')

        return {
          ...dbConfig,
          // 自动加载实体文件
          // TypeORM 会自动扫描项目中通过 @Entity() 装饰器定义的实体类, 无需手动在 entities 数组中逐个列出
          autoLoadEntities: true,
          // 控制 TypeORM 的日志输出级别 eg: 设置为 ['error'] 时, 仅在发生错误时输出日志
          logging: dbLogging,
          // 自定义日志记录器, 替代 TypeORM 默认的日志实现
          logger: new CustomORMLogger(dbLogging)
        }
      },
      // 支持自定义 TypeORM 的 DataSource 实例, 适用于需要完全控制初始化流程的场景
      dataSourceFactory: async options => {
        const dataSource = await new DataSource(options!).initialize()
        return dataSource
      }
    })
  ],
  // 仅在当前模块内可见
  providers,
  exports: providers
})
export class DatabaseModule {}
