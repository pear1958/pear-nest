import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { MenuModule } from './menu/menu.module'
import { RoleModule } from './role/role.module'
import { UserModule } from './user/user.module'
import { LogModule } from './log/log.module'

const modules = [RoleModule, MenuModule, UserModule, LogModule]

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
