import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoleService } from './role.service'
import { RoleController } from './role.controller'
import { RoleEntity } from './role.entity'
import { MenuModule } from '../menu/menu.module'
import { SseModule } from '@/sse/sse.module'

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity]), forwardRef(() => MenuModule), SseModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [TypeOrmModule, RoleService]
})
export class RoleModule {}
