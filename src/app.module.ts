import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './modules/user/user.module'
import { RoleModule } from './modules/system/role/role.module';
import { MenuModule } from './modules/system/menu/menu.module';

@Module({
  imports: [UserModule, RoleModule, MenuModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
