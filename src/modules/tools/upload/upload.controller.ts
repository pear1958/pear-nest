import { BadRequestException, Controller, Post, Req } from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FastifyRequest } from 'fastify'
import { UploadService } from './upload.service'
import { ApiSecurityAuth } from '@/common/decorator/swagger.decorator'
import { definePermission, Perm } from '@/common/decorator/permission.decorator'
import { AuthUser } from '@/constant/auth-user.decorator'
import { FileUploadDto } from './upload.dto'
import { MultipartFile } from '@fastify/multipart'

export const permissions = definePermission('upload', {
  UPLOAD: 'upload'
} as const)

@ApiSecurityAuth()
@ApiTags('Tools - 上传模块')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Perm(permissions.UPLOAD)
  @ApiOperation({ summary: '上传' })
  // 当前接口能够接受哪些媒体类型（MIME types）的请求体  默认为 application/json
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: FileUploadDto
  })
  async upload(@Req() req: FastifyRequest, @AuthUser() user: AuthUser) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart')
    }

    // 只会获取并处理请求中的第一个文件
    // const file = await req.file()

    // 处理多个文件
    const files: AsyncIterableIterator<MultipartFile> = req.files()
    const filePaths = []

    for await (const file of files) {
      try {
        const path = await this.uploadService.saveFile(file, user.uid)
        filePaths.push(path)
        return {
          filePaths
        }
      } catch (err) {
        console.log('err', err)
        throw new BadRequestException('上传失败')
      }
    }
  }
}
