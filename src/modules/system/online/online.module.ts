import { Module } from '@nestjs/common'
import { OnlineService } from './online.service'
import { OnlineController } from './online.controller'
import { UserModule } from '../user/user.module'
import { AuthModule } from '@/modules/auth/auth.module'

@Module({
  imports: [UserModule, AuthModule],
  controllers: [OnlineController],
  providers: [OnlineService],
  exports: [OnlineService]
})
export class OnlineModule {}
