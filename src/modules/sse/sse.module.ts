import { Module, forwardRef } from '@nestjs/common'
import { SseService } from './sse.service'
import { SseController } from './sse.controller'
import { OnlineModule } from '@/modules/system/online/online.module'

@Module({
  imports: [forwardRef(() => OnlineModule)],
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService]
})
export class SseModule {}
