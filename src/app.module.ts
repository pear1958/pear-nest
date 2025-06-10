import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './modules/user/user.module'
import { DeviceModule } from './modules/device/device.module'
import { SystemModule } from './modules/system/system.module'
import { TransformInterceptor } from './common/interceptor/transform'

@Module({
  imports: [UserModule, DeviceModule, SystemModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: TransformInterceptor }]
})
export class AppModule {}
