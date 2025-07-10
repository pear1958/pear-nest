import { OnQueueCompleted, Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { SYS_TASK_QUEUE_NAME } from './task.constant'
import { TaskService } from './task.service'
import { TaskLogService } from '../log/services/task-log.service'

export interface ExecuteData {
  id: number
  args?: string | null
  service: string
}

// 队列处理器类
@Processor(SYS_TASK_QUEUE_NAME)
export class TaskConsumer {
  constructor(
    private taskService: TaskService,
    private taskLogService: TaskLogService
  ) {}

  // 标记为处理队列任务的方法
  @Process()
  async handle(job: Job<ExecuteData>): Promise<void> {
    const startTime = Date.now()
    const { data } = job

    try {
      await this.taskService.callService(data.service, data.args)
      const timing = Date.now() - startTime
      // 任务执行成功
      await this.taskLogService.create(data.id, 1, timing)
    } catch (err) {
      const timing = Date.now() - startTime
      // 执行失败
      await this.taskLogService.create(data.id, 0, timing, `${err}`)
    }
  }

  // 当队列中的任务完成时触发
  @OnQueueCompleted()
  onCompleted(job: Job<ExecuteData>) {
    this.taskService.updateTaskCompleteStatus(job.data.id)
  }
}
