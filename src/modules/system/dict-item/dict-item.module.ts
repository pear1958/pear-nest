import { Module } from '@nestjs/common';
import { DictItemService } from './dict-item.service';
import { DictItemController } from './dict-item.controller';

@Module({
  controllers: [DictItemController],
  providers: [DictItemService],
})
export class DictItemModule {}
