import { DynamicModule, ExistingProvider, Module } from '@nestjs/common'
import { SystemModule } from '../system/system.module'
import { LogModule } from '../system/log/log.module'
import { LogClearJob } from './jobs/log-clear.job'
import { EmailJob } from './jobs/email.job'
import { HttpRequestJob } from './jobs/http-request.job'

const providers = [LogClearJob, EmailJob, HttpRequestJob]

/**
 * auto create alias
 * {
 *    provide: 'LogClearMissionService',
 *    useExisting: LogClearMissionService,
 *  }
 */
const createAliasProviders = (): ExistingProvider[] =>
  providers.map(p => ({
    provide: p.name,
    useExisting: p
  }))

/**
 * 所有需要执行的定时任务都需要在这里注册
 */
@Module({})
export class TaskModule {
  static forRoot(): DynamicModule {
    // 使用Alias定义别名，使得可以通过字符串类型获取定义的Service，否则无法获取
    const aliasProviders = createAliasProviders()

    return {
      global: true,
      module: TaskModule,
      imports: [SystemModule, LogModule],
      providers: [...providers, ...aliasProviders],
      exports: aliasProviders
    }
  }
}
