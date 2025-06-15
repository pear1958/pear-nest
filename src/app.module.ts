import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TransformInterceptor } from './common/interceptor/transform'
import { DeviceModule, SystemModule, UserModule } from './modules'
import config from './config'
import { SharedModule } from './shared/shared.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 如果在多个文件中查找一个变量, 则第一个优先
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      // 支持配置文件中使用变量
      expandVariables: true,
      // 注入自定义配置
      load: [...Object.values(config)]
    }),
    SharedModule,
    UserModule,
    DeviceModule,
    SystemModule
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: TransformInterceptor }]
})
export class AppModule {}
