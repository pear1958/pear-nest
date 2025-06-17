import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ClsModule } from 'nestjs-cls'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TransformInterceptor } from './common/interceptor/transform'
import { DeviceModule, SystemModule, UserModule } from './modules'
import config from './config'
import { SharedModule } from './shared/shared.module'
import { DatabaseModule } from './shared/database/database.module'

@Module({
  imports: [
    // 在 NestJS 应用启动后才会加载环境变量
    ConfigModule.forRoot({
      isGlobal: true,
      // 如果在多个文件中查找一个变量, 则第一个优先
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      // 支持配置文件中使用变量
      expandVariables: true,
      // 注入自定义配置
      load: [...Object.values(config)]
    }),
    // 启用 CLS 上下文
    ClsModule.forRoot({
      global: true,
      // https://github.com/Papooch/nestjs-cls/issues/92
      interceptor: {
        mount: true,
        setup: (cls, context) => {
          const req = context.switchToHttp().getRequest()
          if (req.params?.id && req.body) {
            // 供自定义参数验证器(UniqueConstraint)使用
            const id = req.params.id || req.body.id
            cls.set('operateId', Number.parseInt(id))
          }
        }
      }
    }),
    SharedModule,
    DatabaseModule,
    UserModule,
    DeviceModule,
    SystemModule
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: TransformInterceptor }]
})
export class AppModule {}
