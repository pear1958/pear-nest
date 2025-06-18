import { FastifyAdapter } from '@nestjs/platform-fastify'
import FastifyMultipart from '@fastify/multipart'
import FastifyCookie from '@fastify/cookie'

/**
 * 安装 class-transformer 否则 main.ts 中 ts 会报错
 */
const app: FastifyAdapter = new FastifyAdapter({
  // 启用对反向代理的支持
  trustProxy: true,
  // 禁用 Fastify 内置的日志记录功能, Fastify 默认会记录请求和响应的详细信息
  logger: false
})

// 为 Fastify 应用注册 文件上传处理能力, 并通过限制参数保护应用免受恶意或意外的资源滥用
app.register(FastifyMultipart, {
  limits: {
    fields: 10,
    fileSize: 1024 * 1024 * 20,
    files: 5
  }
})

app.register(FastifyCookie, {
  secret: 'cookie-secret' // 这个 secret 不太重要, 不存鉴权相关, 无关紧要
})

app.getInstance().addHook('onRequest', (request, reply, done) => {
  // set undefined origin
  const { origin } = request.headers
  if (!origin) request.headers.origin = request.headers.host

  const { url } = request

  if (url.endsWith('.php')) {
    reply.raw.statusMessage = 'not support PHP'
    return reply.code(418).send()
  }

  // skip favicon request
  if (url.match(/favicon.ico$/) || url.match(/manifest.json$/)) return reply.code(204).send()

  done()
})

export { app as fastifyApp }
