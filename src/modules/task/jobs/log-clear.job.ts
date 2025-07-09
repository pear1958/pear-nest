import { Injectable } from '@nestjs/common'
import { LoginLogService } from '@/modules/system/log/services/login-log.service'
import { Mission } from '../mission.decorator'

/**
 * 管理后台日志清理任务
 */
@Injectable()
@Mission()
export class LogClearJob {
  constructor(private loginLogService: LoginLogService) {}

  async clearLoginLog(): Promise<void> {
    await this.loginLogService.clearLog()
  }
}
