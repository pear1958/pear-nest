import type { Socket } from 'socket.io'
import { BusinessEvents } from '../../constant/business-event.constant'

export abstract class BaseGateway {
  public gatewayMessageFormat(type: BusinessEvents, message: any, code?: number) {
    return {
      type,
      data: message,
      code
    }
  }

  handleConnect(client: Socket) {
    client.send(this.gatewayMessageFormat(BusinessEvents.GATEWAY_CONNECT, 'WebSocket 已连接'))
  }

  handleDisconnect(client: Socket) {
    client.send(this.gatewayMessageFormat(BusinessEvents.GATEWAY_DISCONNECT, 'WebSocket 断开'))
  }
}

export abstract class BroadcastBaseGateway extends BaseGateway {
  broadcast(event: BusinessEvents, data: any) {}
}
