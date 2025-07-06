import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserEntity } from './user.entity'
import { ParamConfigModule } from '../param-config/param-config.module'
import { RoleModule } from '../role/role.module'
import { MenuModule } from '../menu/menu.module'

const providers = [UserService]

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ParamConfigModule, RoleModule, MenuModule],
  controllers: [UserController],
  providers: [...providers],
  exports: [TypeOrmModule, ...providers]
})
export class UserModule {}
