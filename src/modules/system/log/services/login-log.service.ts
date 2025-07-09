import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, Like, Repository } from 'typeorm'
import { UAParser } from 'ua-parser-js'
import { LoginLogEntity } from '../entities/login-log.entity'
import { getIpAddress } from '@/utils/ip.util'
import { LoginLogQueryDto } from '../log.dto'
import { paginateRaw } from '@/helper/paginate'
import { LoginLogInfo } from '../log.model'

async function parseLoginLog(e: any): Promise<LoginLogInfo> {
  const parser = new UAParser()
  const uaResult = parser.setUA(e.login_log_ua).getResult()
  return {
    id: e.login_log_id,
    ip: e.login_log_ip,
    address: e.login_log_address,
    os: `${`${uaResult.os.name ?? ''} `}${uaResult.os.version}`,
    browser: `${`${uaResult.browser.name ?? ''} `}${uaResult.browser.version}`,
    username: e.user_username,
    time: e.login_log_created_at
  }
}

@Injectable()
export class LoginLogService {
  constructor(
    @InjectRepository(LoginLogEntity)
    private loginLogRepository: Repository<LoginLogEntity>
  ) {}

  async create(uid: number, ip: string, ua: string): Promise<void> {
    try {
      const address = await getIpAddress(ip)
      await this.loginLogRepository.save({
        ip,
        ua,
        address,
        user: { id: uid }
      })
    } catch (err) {
      console.error('err', err)
    }
  }

  async list({ page, pageSize, username, ip, address, time }: LoginLogQueryDto) {
    const queryBuilder = await this.loginLogRepository
      .createQueryBuilder('login_log')
      .innerJoinAndSelect('login_log.user', 'user')
      .where({
        ...(ip && { ip: Like(`%${ip}%`) }),
        ...(address && { address: Like(`%${address}%`) }),
        ...(time && { createdAt: Between(time[0], time[1]) }),
        ...(username && {
          user: {
            username: Like(`%${username}%`)
          }
        })
      })
      .orderBy('login_log.created_at', 'DESC')

    const { items, ...rest } = await paginateRaw<LoginLogEntity>(queryBuilder, {
      page,
      pageSize
    })

    const formatItems = await Promise.all(items.map(item => parseLoginLog(item)))

    return {
      items: formatItems,
      ...rest
    }
  }

  async clearLog(): Promise<void> {
    await this.loginLogRepository.clear()
  }
}
