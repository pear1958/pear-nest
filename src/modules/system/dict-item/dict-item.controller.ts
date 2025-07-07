import { Controller } from '@nestjs/common';
import { DictItemService } from './dict-item.service';

@Controller('dict-item')
export class DictItemController {
  constructor(private readonly dictItemService: DictItemService) {}
}
