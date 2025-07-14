import {
  BeforeApplicationShutdown,
  Controller,
  Ip,
  Param,
  Req,
  Res,
  Headers,
  Sse
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { interval, Observable } from 'rxjs'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { SseService, MessageEvent } from './sse.service'
import { OnlineService } from '@/modules/system/online/online.service'
import { ParseIntPipe } from '@/common/pipe/parse-int.pipe'

@ApiTags('System - sse模块')
@ApiSecurityAuth()
@SkipThrottle() // 跳过请求速率限制
@Controller('sse')
export class SseController implements BeforeApplicationShutdown {
  // 定义一个 Map 用于存储用户 ID 和对应的 Fastify 响应对象，方便后续关闭连接
  private replyMap: Map<number, FastifyReply> = new Map()

  constructor(
    private readonly sseService: SseService,
    private onlineService: OnlineService
  ) {}

  // 通过控制台关闭程序时触发
  beforeApplicationShutdown() {
    console.log('beforeApplicationShutdown')
    this.closeAllConnect()
  }

  private closeAllConnect() {
    this.sseService.sendToAllUser({
      type: 'close',
      data: 'bye~'
    })
    this.replyMap.forEach(reply => {
      reply.raw.end().destroy()
    })
  }

  @ApiOperation({ summary: '服务端推送消息' })
  // 创建 SSE 的端点
  // 客户端可以通过访问类似 sse/123 的 URL 来建立与特定用户的 SSE 连接
  @Sse(':uid')
  async sse(
    @Param('uid', ParseIntPipe) uid: number,
    @Req() req: FastifyRequest,
    // 使用 Res 装饰器获取 Fastify 响应对象
    @Res() res: FastifyReply,
    @Ip() ip: string,
    @Headers('user-agent') ua: string
  ): Promise<Observable<MessageEvent>> {
    this.replyMap.set(uid, res)

    this.onlineService.addOnlineUser(req.accessToken, ip, ua)

    // SSE 端点一般需要返回一个可观察对象（Observable），以此来持续发出事件
    // 返回一个 Observable，NestJS 会将这个可观察对象转换为 SSE 流，并将其发送到客户端
    return new Observable(subscriber => {
      // 定时推送，保持连接
      const subscription = interval(12000).subscribe(() => {
        // 用于向订阅者发送一个新的值
        subscriber.next({ type: 'ping' })
      })

      // console.log(`user-${uid}已连接`)
      this.sseService.addClient(uid, subscriber)

      // 当客户端断开连接时
      req.raw.on('close', () => {
        subscription.unsubscribe()
        this.sseService.removeClient(uid, subscriber)
        this.replyMap.delete(uid)
        this.onlineService.removeOnlineUser(req.accessToken)
        console.log(`user-${uid}已关闭`)
      })
    })
  }
}
