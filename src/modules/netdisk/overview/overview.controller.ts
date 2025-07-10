import { Controller, Get, UseInterceptors } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { OverviewService } from './overview.service'
import { OverviewSpaceInfo } from './overview.dto'

export const permissions = definePermission('netdisk:overview', {
  DESC: 'desc'
} as const)

@ApiTags('NetDiskOverview - 网盘概览模块')
@Controller('overview')
export class OverviewController {
  constructor(private overviewService: OverviewService) {}

  @Get('desc')
  @CacheKey('netdisk_overview_desc')
  @CacheTTL(3600)
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: '获取网盘空间数据统计' })
  @ApiOkResponse({ type: OverviewSpaceInfo })
  @Perm(permissions.DESC)
  async space(): Promise<OverviewSpaceInfo> {
    // 获取当月1号零时
    const date = this.overviewService.getZeroHourAnd1Day(new Date())
    const space = await this.overviewService.getSpace(date)
    const hit = await this.overviewService.getHit(date)
    const flow = await this.overviewService.getFlow(date)
    const count = await this.overviewService.getCount(date)

    return {
      // 当前使用容量
      spaceSize: space.datas[space.datas.length - 1],
      // 当前文件数量
      fileSize: count.datas[count.datas.length - 1],
      // 当天使用流量
      flowSize: flow.datas[flow.datas.length - 1],
      // 当天请求次数
      hitSize: hit.datas[hit.datas.length - 1],
      // 流量趋势，从当月1号开始计算
      flowTrend: flow,
      // 容量趋势，从当月1号开始计算
      sizeTrend: space
    }
  }
}
