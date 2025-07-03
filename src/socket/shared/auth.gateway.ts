import { JwtService } from '@nestjs/jwt'
import {
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect
} from '@nestjs/websockets'
import { OnEvent } from '@nestjs/event-emitter'
import { Namespace, Socket } from 'socket.io'
import { BroadcastBaseGateway } from './base.gateway'
import { TokenService } from '@/modules/auth/services/token.service'
import { CacheService } from '@/shared/redis/cache.service'
import { BusinessEvents } from '../../constant/business-event.constant'
import { EventBusEvents } from '@/constant/event-bus.constant'

export interface AuthGatewayOptions {
  namespace: string
}

// @ts-expect-error
export interface IAuthGateway
  extends OnGatewayConnection,
    OnGatewayDisconnect,
    BroadcastBaseGateway {}

export function createAuthGateway(
  options: AuthGatewayOptions
): new (...args: any[]) => IAuthGateway {
  // 从配置选项中解构出命名空间
  const { namespace } = options

  class AuthGateway extends BroadcastBaseGateway implements IAuthGateway {
    constructor(
      protected readonly jwtService: JwtService,
      protected readonly tokenService: TokenService,
      private readonly cacheService: CacheService
    ) {
      super()
    }

    tokenSocketIdMap = new Map<string, string>()

    // 注入 WebSocket 服务器的命名空间实例
    @WebSocketServer()
    protected namespace: Namespace

    // 处理认证失败的方法，向客户端发送认证失败消息并断开连接
    async authFailed(client: Socket) {
      client.send(this.gatewayMessageFormat(BusinessEvents.AUTH_FAILED, '认证失败'))
      client.disconnect()
    }

    // 验证令牌的方法，返回一个布尔值表示令牌是否有效
    async authToken(token: string): Promise<boolean> {
      if (typeof token !== 'string') return false

      const validJwt = async () => {
        try {
          const ok = await this.jwtService.verifyAsync(token)
          if (!ok) return false
        } catch {
          return false
        }
        // is not crash, is verify
        return true
      }

      return await validJwt()
    }

    // 处理客户端连接事件的方法
    async handleConnection(client: Socket) {
      // 从客户端握手信息中获取令牌，优先从查询参数中获取，其次从请求头中获取
      const token =
        client.handshake.query.token ||
        client.handshake.headers.authorization ||
        client.handshake.headers.Authorization

      if (!token) return this.authFailed(client)

      // 令牌无效, 调用认证失败处理方法
      if (!(await this.authToken(token as string))) return this.authFailed(client)

      // 调用父类的处理连接方法，向客户端发送连接成功消息
      super.handleConnect(client)

      // 将令牌和 客户端唯一标识 的映射关系存储在 tokenSocketIdMap 中
      const sid = client.id
      this.tokenSocketIdMap.set(token.toString(), sid)
    }

    // 处理客户端断开连接事件
    handleDisconnect(client: Socket) {
      super.handleDisconnect(client)
    }

    // 监听令牌过期事件
    @OnEvent(EventBusEvents.TokenExpired)
    handleTokenExpired(token: string) {
      const sid = this.tokenSocketIdMap.get(token)
      if (!sid) return false

      // 根据客户端标识获取对应的 WebSocket 连接
      const socket = this.namespace.server.of(`/${namespace}`).sockets.get(sid)
      if (socket) {
        // 断开过期令牌对应的客户端连接
        socket.disconnect()
        // 调用父类的处理断开连接方法
        super.handleDisconnect(socket)
        return true
      }

      return false
    }

    // 重写父类的广播方法，向指定命名空间的所有客户端发送消息
    override broadcast(event: BusinessEvents, data: any) {
      this.cacheService.emitter
        .of(`/${namespace}`)
        .emit('message', this.gatewayMessageFormat(event, data))
    }
  }

  // 返回创建的认证网关类
  return AuthGateway
}
