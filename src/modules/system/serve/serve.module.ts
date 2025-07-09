import { forwardRef, Module } from '@nestjs/common'
import { ServeService } from './serve.service'
import { ServeController } from './serve.controller'
import { SystemModule } from '../system.module'

@Module({
  imports: [forwardRef(() => SystemModule)],
  controllers: [ServeController],
  providers: [ServeService],
  exports: [ServeService]
})
export class ServeModule {}
