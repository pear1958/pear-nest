import { Global, Module, type Provider } from '@nestjs/common'
import { QQService } from './qq.service'
import { CronService } from './cron.service'

const providers: Provider[] = [QQService, CronService]

@Global()
@Module({
  imports: [],
  providers,
  exports: providers
})
export class HelperModule {}
