import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DictItemService } from './dict-item.service'
import { DictItemController } from './dict-item.controller'
import { DictItemEntity } from './dict-item.entity'

@Module({
  imports: [TypeOrmModule.forFeature([DictItemEntity])],
  controllers: [DictItemController],
  providers: [DictItemService],
  exports: [TypeOrmModule, DictItemService]
})
export class DictItemModule {}
