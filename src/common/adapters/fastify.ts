import { FastifyAdapter } from '@nestjs/platform-fastify'

// 安装 class-transformer 否则 ts 会报错
const app: FastifyAdapter = new FastifyAdapter({
  // @see https://www.fastify.io/docs/latest/Reference/Server/#trustproxy
  trustProxy: true,
  logger: false
  // forceCloseConnections: true,
})
export { app as fastifyApp }
