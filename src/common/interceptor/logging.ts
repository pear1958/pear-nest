import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // 私有属性, 用于内部访问
  private logger = new Logger(LoggingInterceptor.name, { timestamp: false })

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const baseInfo = `${request.method} -> ${request.url}`

    this.logger.debug(`+++ 请求：${baseInfo}`)

    const now = Date.now()

    return next.handle().pipe(
      tap(() => {
        const time = Date.now() - now
        this.logger.debug(`--- 响应：${baseInfo}${` +${time}ms`}`)
      })
    )
  }
}
