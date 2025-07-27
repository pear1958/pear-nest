import { Controller, Get, Param, Res } from '@nestjs/common'
import { Response } from 'express'
import { createHash } from 'crypto'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { NetDiskFileService } from './file.service'
import { FileMetadata } from './file.dto'
import { Perm, definePermission } from '@/common/decorator/permission.decorator'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'

export const permissions = definePermission('netdisk:file', {
  METADATA: 'metadata'
} as const)

@ApiTags('NetDisk - 文件模块')
@ApiSecurityAuth()
@Controller('netdisk/files')
export class NetDiskFileController {
  constructor(private fileService: NetDiskFileService) {}

  /**
   * 获取文件元数据（应用协商缓存四字段）
   * 场景：频繁查看但不常变更的文件信息，优先用ETag校验，Last-Modified作为补充
   */
  @Get(':fileId/metadata')
  @ApiOperation({ summary: '获取文件元数据（协商缓存）' })
  @Perm(permissions.METADATA)
  async getFileMetadata(
    @Param('fileId') fileId: number,
    @Res({ passthrough: true }) res: Response
  ): Promise<FileMetadata> {
    // 1. 获取文件元数据（假设包含id、name、size、updatedAt等）
    const metadata = await this.fileService.getMetadata(fileId)
    if (!metadata) {
      res.status(404).end()
      return null
    }

    // 2. 生成ETag（基于元数据的哈希值，内容变更则ETag变更）
    const etag = createHash('md5').update(JSON.stringify(metadata)).digest('hex')
    // 3. 获取Last-Modified（文件最后修改时间）
    const lastModified = new Date(metadata.updatedAt).toUTCString()

    // 4. 设置响应头（返回ETag和Last-Modified）
    res.setHeader('ETag', `"${etag}"`) // ETag通常带双引号
    res.setHeader('Last-Modified', lastModified)

    // 5. 从请求头获取客户端缓存的标识
    const ifNoneMatch = res.req.headers['if-none-match']
    const ifModifiedSince = res.req.headers['if-modified-since']

    // 6. 优先校验ETag，不一致则直接返回新数据
    if (ifNoneMatch !== `"${etag}"`) {
      return metadata
    }

    // 7. ETag一致时，再校验Last-Modified
    if (ifModifiedSince === lastModified) {
      // 两者均未变更，返回304
      res.status(304).end()
      return null
    }

    // 8. ETag一致但Last-Modified变更（极端情况，如内容未变但修改时间被手动修改）
    return metadata
  }
}
