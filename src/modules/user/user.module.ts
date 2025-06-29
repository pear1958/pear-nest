import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserEntity } from './user.entity'
import { ParamConfigModule } from '../system/param-config/param-config.module'

const providers = [UserService]

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ParamConfigModule],
  controllers: [UserController],
  providers: [...providers],
  exports: [TypeOrmModule, ...providers]
})
export class UserModule {}
