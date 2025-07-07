import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DeptService } from './dept.service'
import { DeptController } from './dept.controller'
import { DeptEntity } from './dept.entity'
import { UserModule } from '../user/user.module'
import { RoleModule } from '../role/role.module'

@Module({
  imports: [TypeOrmModule.forFeature([DeptEntity]), UserModule, RoleModule],
  controllers: [DeptController],
  providers: [DeptService],
  exports: [TypeOrmModule, DeptService]
})
export class DeptModule {}
