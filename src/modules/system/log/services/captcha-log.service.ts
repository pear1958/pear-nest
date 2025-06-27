import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CaptchaLogEntity } from '../entities/captcha-log.entity'

@Injectable()
export class CaptchaLogService {
  constructor(
    @InjectRepository(CaptchaLogEntity)
    private captchaLogRepository: Repository<CaptchaLogEntity>
  ) {}

  async create(
    account: string,
    code: string,
    provider: 'sms' | 'email',
    userId?: number
  ): Promise<void> {
    await this.captchaLogRepository.save({
      account,
      code,
      provider,
      userId
    })
  }
}
