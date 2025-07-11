const { cpus } = require('node:os')

// 当前系统的 CPU 核心数量
const cpuLen = cpus().length

module.exports = {
  // apps 数组包含了要管理的应用程序的配置信息
  // 每个对象代表一个应用程序
  apps: [
    {
      // 应用程序的名称，用于在 PM2 中标识该应用程序
      name: 'pear-admin',
      // 要运行的脚本文件的路径
      // 这里指定为编译后的主文件，通常是 NestJS 应用编译后的入口文件
      script: './dist/main.js',
      // 当应用程序崩溃或退出时，PM2 是否自动重启该应用程序
      autorestart: true,
      // 应用程序的执行模式
      // cluster 表示以集群模式运行应用程序，充分利用多核 CPU 的性能
      exec_mode: 'cluster',
      // 是否监听文件变化并自动重启应用程序
      // 设置为 false 表示不监听文件变化，避免不必要的重启
      watch: false,
      // 要启动的应用程序实例数量
      // 这里设置为 CPU 核心数，即每个 CPU 核心运行一个实例
      instances: cpuLen,
      // 当应用程序使用的内存超过指定限制时，PM2 会自动重启应用程序
      // 这里设置为 1G，表示当应用程序使用的内存超过 1GB 时重启
      max_memory_restart: '1G',
      // 传递给脚本的额外参数  这里为空，表示不传递额外参数
      args: '',
      env: {
        // 设置 NODE_ENV 环境变量为 'production'，表示生产环境
        NODE_ENV: 'production',
        // 设置 PORT 环境变量为 process.env.APP_PORT
        // 这样应用程序可以通过 process.env.PORT 获取端口号
        PORT: process.env.APP_PORT,
      },
      max_restarts: 10, // 最多重启 10 次
    },
  ],
}
