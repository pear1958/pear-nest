import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoleService } from './role.service'
import { RoleController } from './role.controller'
import { RoleEntity } from './role.entity'
import { MenuModule } from '../menu/menu.module'
import { SseService } from '@/sse/sse.service'

const providers = [RoleService, SseService]

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity]), forwardRef(() => MenuModule)],
  controllers: [RoleController],
  providers: [...providers],
  exports: [TypeOrmModule, ...providers]
})
export class RoleModule {}
