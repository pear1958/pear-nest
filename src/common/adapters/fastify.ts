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

// 获取 Fastify 实例 并添加请求前钩子
// 先于 NestJS 全局拦截器执行
app.getInstance().addHook('onRequest', (request, reply, done) => {
  /**
   * 处理请求头中的origin字段
   * 场景: 某些客户端或代理可能不发送origin头，导致后端获取不到来源信息
   * 解决方案: 用host头(格式为 "域名: 端口")作为替代 origin
   */
  const { origin } = request.headers
  if (!origin) request.headers.origin = request.headers.host

  /**
   * 拦截以 .php 结尾的请求
   * 目的: 明确拒绝PHP相关请求(用于防止恶意PHP文件执行或表明服务不支持PHP)
   * 418: I'm a teapot(非标准但常用于表示不支持的请求)
   */
  const { url } = request

  if (url.endsWith('.php')) {
    reply.raw.statusMessage = 'not support PHP'
    return reply.code(418).send()
  }

  /**
   * 跳过favicon和manifest请求
   * 优化: 避免为静态资源(如网站图标、PWA清单)执行完整的路由处理
   * 响应: 204 No Content(告知客户端无需返回内容)
   */
  if (url.match(/favicon.ico$/) || url.match(/manifest.json$/)) return reply.code(204).send()

  // 所有预处理完成, 继续处理请求
  done()
})

export { app as fastifyApp }
