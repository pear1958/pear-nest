import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { MenuModule } from './menu/menu.module'
import { RoleModule } from './role/role.module'
import { UserModule } from './user/user.module'
import { LogModule } from './log/log.module'
import { ParamConfigModule } from './param-config/param-config.module'

const modules = [UserModule, RoleModule, MenuModule, LogModule, ParamConfigModule]

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
