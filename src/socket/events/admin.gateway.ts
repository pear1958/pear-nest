import { JwtService } from '@nestjs/jwt'
import {
  GatewayMetadata,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { Server } from 'socket.io'
import { AuthService } from '@/modules/auth/auth.service'
import { CacheService } from '@/shared/redis/cache.service'
import { createAuthGateway } from '../shared/auth.gateway'

const AuthGateway = createAuthGateway({ namespace: 'admin' })

@WebSocketGateway<GatewayMetadata>({ namespace: 'admin' })
export class AdminEventsGateway
  extends AuthGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly authService: AuthService,
    private readonly cacheService: CacheService
  ) {
    super(jwtService, authService, cacheService)
  }

  // 使用WebSocketServer装饰器，将_server属性标记为WebSocket服务器实例
  @WebSocketServer()
  protected _server: Server

  // 定义一个getter方法，用于获取WebSocket服务器实例
  get server() {
    return this._server
  }
}
