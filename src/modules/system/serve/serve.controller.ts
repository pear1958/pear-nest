import { Controller, Get, UseInterceptors } from '@nestjs/common'
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager'
import { ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ServeService } from './serve.service'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { ServeStatInfo } from './serve.model'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { AllowAnon } from '@/constant/allow-anon.decorator'

@ApiTags('System - 服务监控')
@ApiSecurityAuth()
@ApiExtraModels(ServeStatInfo)
@Controller('serve')
@UseInterceptors(CacheInterceptor) // 启用缓存拦截器
@CacheKey('serve_stat') // 对 API 响应的缓存
@CacheTTL(10000) // 设置缓存的过期时间 单位为秒 约 2.78 小时）
export class ServeController {
  constructor(private readonly serveService: ServeService) {}

  @Get('stat')
  @ApiOperation({ summary: '获取服务器运行信息' })
  @ApiResult({ type: ServeStatInfo })
  @AllowAnon()
  async stat(): Promise<ServeStatInfo> {
    return this.serveService.getServeStat()
  }
}
