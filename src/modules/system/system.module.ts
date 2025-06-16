import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { MenuModule } from './menu/menu.module'
import { RoleModule } from './role/role.module'
import { UserModule } from './user/user.module'

const modules = [RoleModule, MenuModule, UserModule]

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
