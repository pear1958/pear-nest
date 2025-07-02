import cluster from 'node:cluster'
import { Cron } from '@nestjs/schedule'
import { isMainProcess } from '@/utils/env.util'

/**
 * 自定义装饰器：确保定时任务只在特定进程中执行一次
 * - 非集群模式下：在主进程执行
 * - 集群模式下：只在第一个工作进程（worker id=1）执行
 */
export const CronOnce: typeof Cron = (...rest): MethodDecorator => {
  // 情况1：非集群模式下，直接使用原始Cron装饰器（主进程）
  if (isMainProcess) {
    // 调用原始Cron装饰器并传入相同参数
    // 这里使用call是为了确保正确的上下文
    return Cron.call(null, ...rest)
  }

  // 情况2：集群模式下，判断是否为第一个工作进程
  if (cluster.isWorker && cluster.worker?.id === 1) {
    return Cron.call(null, ...rest)
  }

  // 当应用以集群模式运行时，除了第一个工作进程（worker id=1）之外的其他工作进程会执行第三种情况

  // 情况3：其他进程不执行定时任务
  // 返回一个空装饰器，不做任何处理
  const returnNothing: MethodDecorator = () => {}
  return returnNothing
}
