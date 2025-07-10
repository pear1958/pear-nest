import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { UserModule } from '../system/user/user.module'
import { OverviewController } from './overview/overview.controller'
import { OverviewService } from './overview/overview.service'

@Module({
  imports: [
    UserModule,
    RouterModule.register([
      {
        path: 'netdisk',
        module: NetdiskModule
      }
    ])
  ],
  controllers: [OverviewController],
  providers: [OverviewService]
})
export class NetdiskModule {}
