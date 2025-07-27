import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { StorageService } from './storage.service'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { ApiResult } from '@/common/decorator/api-result.decorator'
import { StorageInfo } from './storage.model'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { StorageDeleteDto, StoragePageDto } from './storage.dto'
import { Pagination } from '@/helper/paginate/pagination'
import { Response } from 'express'
import { join } from 'path'
import { createReadStream } from 'fs'
import { createHash } from 'crypto'

export const permissions = definePermission('tool:storage', {
  LIST: 'list',
  DELETE: 'delete'
} as const)

@ApiTags('Tools - 存储模块')
@ApiSecurityAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('list')
  @ApiOperation({ summary: '获取本地存储列表' })
  @ApiResult({ type: [StorageInfo], isPage: true })
  @Perm(permissions.LIST)
  async list(@Query() dto: StoragePageDto): Promise<Pagination<StorageInfo>> {
    return this.storageService.list(dto)
  }

  @ApiOperation({ summary: '删除文件' })
  @Post('delete')
  @Perm(permissions.DELETE)
  async delete(@Body() dto: StorageDeleteDto): Promise<void> {
    await this.storageService.delete(dto.ids)
  }

  /**
   * 获取静态文件（应用强缓存）
   * 场景：用户头像、系统图标等不常变更的资源
   * 
   */
  @Get('static/:fileName')
  @ApiOperation({ summary: '获取静态文件（强缓存）' })
  getStaticFile(@Param('fileName') fileName: string, @Res() res: Response) {
    // 假设文件存储在项目的 static 目录下
    const filePath = join(process.cwd(), 'static', fileName)

    const stream = createReadStream(filePath)

    // 强缓存配置：1年后过期（31536000秒）
    res.setHeader('Cache-Control', 'public, max-age=31536000')

    // 兼容 HTTP 1.0 的 Expires（1年后）
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    res.setHeader('Expires', expires.toUTCString())

    stream.pipe(res)
  }

  /**
   * 获取文件列表（应用协商缓存）
   * 场景：可能频繁变更的动态数据，减少重复传输
   */
  @Get('list2')
  @ApiOperation({ summary: '获取文件列表（协商缓存）' })
  @ApiResult({ type: [StorageInfo], isPage: true })
  @Perm(permissions.LIST)
  async list2(
    @Query() dto: StoragePageDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Pagination<StorageInfo>> {
    // 1. 获取文件列表数据
    const data = await this.storageService.list(dto)

    // 2. 生成 ETag（基于数据的哈希值，数据变更则 ETag 变更）
    const etag = createHash('md5').update(JSON.stringify(data)).digest('hex')
    res.setHeader('ETag', `"${etag}"`)

    // 3. 检查客户端请求头的 If-None-Match
    // 客户端再次请求时，会在 If-None-Match 头中携带上次的 ETag
    const ifNoneMatch = res.req.headers['if-none-match']
    if (ifNoneMatch === `"${etag}"`) {
      // 缓存有效，返回 304
      res.status(304).end()
      return null // 后续逻辑不再执行
    }

    // 4. 缓存无效，返回新数据
    return data
  }
}
