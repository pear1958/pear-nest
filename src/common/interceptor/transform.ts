import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { BYPASS_KEY } from '../decorators/bypass'
import { HttpResponse } from '../model/response'

/**
 * 统一处理接口请求与响应结果, 如果不需要则添加 @Bypass 装饰器
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  // 支持访问路由的元数据
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const bypass = this.reflector.get<boolean>(BYPASS_KEY, context.getHandler())

    if (bypass) {
      return next.handle() // 将请求传递给下一个环节
    }

    return next.handle().pipe(
      map(data => {
        return new HttpResponse(HttpStatus.OK, data ?? null)
      })
    )
  }
}
