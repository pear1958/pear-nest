import { Controller } from '@nestjs/common';
import { ParamConfigService } from './param-config.service';

@Controller('param-config')
export class ParamConfigController {
  constructor(private readonly paramConfigService: ParamConfigService) {}
}
