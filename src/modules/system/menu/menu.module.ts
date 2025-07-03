import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MenuService } from './menu.service'
import { MenuController } from './menu.controller'
import { MenuEntity } from './menu.entity'
import { RoleModule } from '../role/role.module'

const providers = [MenuService]

@Module({
  imports: [TypeOrmModule.forFeature([MenuEntity]), forwardRef(() => RoleModule)],
  controllers: [MenuController],
  providers,
  exports: [TypeOrmModule, ...providers]
})
export class MenuModule {}
