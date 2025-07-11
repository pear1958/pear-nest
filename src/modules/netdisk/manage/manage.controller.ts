import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { ManageService } from './manage.service'
import { GetFileListDto } from './manage.dto'
import { SFileList } from './manage.model'

export const permissions = definePermission('netdisk:manage', {
  LIST: 'list',
  CREATE: 'create',
  INFO: 'info',
  UPDATE: 'update',
  DELETE: 'delete',
  MKDIR: 'mkdir',
  TOKEN: 'token',
  MARK: 'mark',
  DOWNLOAD: 'download',
  RENAME: 'rename',
  CUT: 'cut',
  COPY: 'copy'
} as const)

@ApiTags('NetDiskManage - 网盘管理模块')
@Controller('manage')
export class ManageController {
  constructor(private manageService: ManageService) {}

  @Get('list')
  @ApiOperation({ summary: '获取文件列表' })
  @ApiOkResponse({ type: SFileList })
  @Perm(permissions.LIST)
  async list(@Query() dto: GetFileListDto): Promise<SFileList> {
    return await this.manageService.getFileList(dto.path, dto.marker, dto.key)
  }
}
