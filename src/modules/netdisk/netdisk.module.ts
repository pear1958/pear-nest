import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { UserModule } from '../system/user/user.module'
import { OverviewController } from './overview/overview.controller'
import { OverviewService } from './overview/overview.service'
import { ManageController } from './manage/manage.controller'
import { ManageService } from './manage/manage.service'

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
  controllers: [OverviewController, ManageController],
  providers: [OverviewService, ManageService]
})
export class NetdiskModule {}
