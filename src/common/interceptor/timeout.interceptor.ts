import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException
} from '@nestjs/common'
import { Observable, throwError, TimeoutError } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'

// https://nest.nodejs.cn/interceptors#%E5%BC%82%E5%B8%B8%E6%98%A0%E5%B0%84

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly time: number = 10000) {}

  // 实现 NestInterceptor 接口的 intercept 方法，用于拦截请求
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 调用 next.handle() 方法获取一个 Observable，表示请求的处理流
    return next.handle().pipe(
      // 使用 timeout 操作符设置请求的超时时间
      timeout(this.time),
      // 使用 catchError 操作符捕获超时错误
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException('请求超时'))
        }
        return throwError(() => err)
      })
    )
  }
}
