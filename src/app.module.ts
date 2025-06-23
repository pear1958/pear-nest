import { Module, ClassSerializerInterceptor } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ClsModule } from 'nestjs-cls'
import { TransformInterceptor } from './common/interceptor/transform.interceptor'
import { DeviceModule, SystemModule, UserModule, AuthModule } from './modules'
import config from './config'
import { SharedModule } from './shared/shared.module'
import { DatabaseModule } from './shared/database/database.module'
import { AllExceptionFilter } from './common/filters/all-exception.filter'

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
    AuthModule,
    UserModule,
    DeviceModule,
    SystemModule
  ],
  controllers: [],
  // 顺序: 请求从前到后依次执行, 响应从后到前依次执行
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    // 使 @Exclude() 等序列化装饰器在整个应用中生效  以及数据转换逻辑等
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    // 使用 NestJS 的内置令牌 APP_INTERCEPTOR 将 TransformInterceptor 注册为 全局拦截器
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor }
  ]
})
export class AppModule {}
