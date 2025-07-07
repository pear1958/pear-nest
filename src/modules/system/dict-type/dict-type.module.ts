import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DictTypeService } from './dict-type.service'
import { DictTypeController } from './dict-type.controller'
import { DictTypeEntity } from './dict-type.entity'

@Module({
  imports: [TypeOrmModule.forFeature([DictTypeEntity])],
  controllers: [DictTypeController],
  providers: [DictTypeService],
  exports: [TypeOrmModule, DictTypeService]
})
export class DictTypeModule {}
