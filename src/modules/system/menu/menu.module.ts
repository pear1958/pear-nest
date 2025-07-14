import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MenuService } from './menu.service'
import { MenuController } from './menu.controller'
import { MenuEntity } from './menu.entity'
import { RoleModule } from '../role/role.module'
import { SseService } from '@/sse/sse.service'

const providers = [MenuService, SseService]

@Module({
  imports: [TypeOrmModule.forFeature([MenuEntity]), forwardRef(() => RoleModule)],
  controllers: [MenuController],
  providers,
  exports: [TypeOrmModule, ...providers]
})
export class MenuModule {}
