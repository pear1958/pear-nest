import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LoginLogEntity } from '../entities/login-log.entity'
import { getIpAddress } from '@/utils/ip.util'

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
}
