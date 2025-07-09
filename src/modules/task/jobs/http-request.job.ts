import { BadRequestException, Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { Mission } from '../mission.decorator'
import { LoggerService } from '@/shared/logger/logger.service'

/**
 * Api接口请求类型任务
 */
@Injectable()
@Mission()
export class HttpRequestJob {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService
  ) {}

  /**
   * 发起请求
   * @param config AxiosRequestConfig
   */
  handle(config: unknown): void {
    if (config) {
      const result = this.httpService.request(config)
      this.logger.log(result, HttpRequestJob.name)
    } else {
      throw new BadRequestException('Http request job param is empty')
    }
  }
}
