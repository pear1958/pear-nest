import { Injectable } from '@nestjs/common'

@Injectable()
export class CaptchaLogService {
  async create(
    account: string,
    code: string,
    provider: 'sms' | 'email',
    uid?: number
  ): Promise<void> {
    // to-do
  }
}
