import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { MenuModule } from './menu/menu.module'
import { RoleModule } from './role/role.module'
import { UserModule } from './user/user.module'
import { LogModule } from './log/log.module'
import { ParamConfigModule } from './param-config/param-config.module'
import { DeptModule } from './dept/dept.module'
import { DictTypeModule } from './dict-type/dict-type.module'
import { DictItemModule } from './dict-item/dict-item.module'
import { OnlineModule } from './online/online.module'

const modules = [
  UserModule,
  RoleModule,
  MenuModule,
  LogModule,
  ParamConfigModule,
  DeptModule,
  DictTypeModule,
  DictItemModule,
  OnlineModule
]

@Module({
  imports: [
    ...modules,
    // 添加统一前缀
    RouterModule.register([
      {
        path: 'system',
        module: SystemModule,
        children: [...modules]
      }
    ])
  ],
  exports: [...modules]
})
export class SystemModule {}
