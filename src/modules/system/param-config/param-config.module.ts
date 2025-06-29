import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ParamConfigService } from './param-config.service'
import { ParamConfigController } from './param-config.controller'
import { ParamConfigEntity } from './param-config.entity'

const providers = [ParamConfigService]

@Module({
  imports: [TypeOrmModule.forFeature([ParamConfigEntity])],
  controllers: [ParamConfigController],
  providers: [...providers],
  exports: [TypeOrmModule, ...providers]
})
export class ParamConfigModule {}
