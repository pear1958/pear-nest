import { Injectable, Logger } from '@nestjs/common'
import { CronExpression } from '@nestjs/schedule'
import { LessThan } from 'typeorm'
import dayjs from 'dayjs'
import { CronOnce } from '@/common/decorator/cron-once.decorator'
import { AccessTokenEntity } from '@/modules/auth/entities/access-token.entity'

/**
 * CronService 会自动调用
 * - 会自动检测带有 @Cron 或自定义 @CronOnce 装饰器的方法，并依据指定的时间表达式来调度执行
 */
@Injectable()
export class CronService {
  private logger: Logger = new Logger(CronService.name)

  // 在每天午夜执行一次
  @CronOnce(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredJWT() {
    this.logger.log('--> 开始扫表，清除过期的 token')

    const expiredTokens = await AccessTokenEntity.find({
      where: {
        expired_at: LessThan(new Date())
      }
    })

    let deleteCount = 0

    await Promise.all(
      expiredTokens.map(async token => {
        const { value, created_at } = token
        await AccessTokenEntity.remove(token)
        this.logger.debug(
          `--> 删除过期的 token：${value}, 签发于 ${dayjs(created_at).format('YYYY-MM-DD H:mm:ss')}`
        )
        deleteCount += 1
      })
    )

    this.logger.log(`--> 删除了 ${deleteCount} 个过期的 token`)
  }
}
