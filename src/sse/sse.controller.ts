import { BeforeApplicationShutdown, Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { SseService } from './sse.service'
import { OnlineService } from '@/modules/system/online/online.service'

@ApiTags('System - sse模块')
@ApiSecurityAuth()
@SkipThrottle()
@Controller('sse')
export class SseController implements BeforeApplicationShutdown {
  constructor(
    private readonly sseService: SseService,
    private onlineService: OnlineService
  ) {}

  // 通过控制台关闭程序时触发
  beforeApplicationShutdown() {
    console.log('beforeApplicationShutdown')
    this.closeAllConnect()
  }

  private closeAllConnect() {}
}
