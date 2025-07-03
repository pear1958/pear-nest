import { forwardRef, Module, Provider } from '@nestjs/common'
import { AuthModule } from '../modules/auth/auth.module'
import { SystemModule } from '../modules/system/system.module'

import { AdminEventsGateway } from './events/admin.gateway'
import { WebEventsGateway } from './events/web.gateway'

const providers: Provider[] = [AdminEventsGateway, WebEventsGateway]

@Module({
  // 允许两个模块在存在循环依赖的情况下相互引用
  // forwardRef 的作用是延迟依赖的解析到运行时，从而避免编译时的循环引用错误
  // 使用 forwardRef 后，SystemModule 仍需导入 SocketModule(若需使用)（同样使用 forwardRef）
  imports: [forwardRef(() => SystemModule), AuthModule],
  providers,
  exports: [...providers]
})
export class SocketModule {}
