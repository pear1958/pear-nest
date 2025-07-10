import { ApiProperty } from '@nestjs/swagger'
import { IsDefined } from 'class-validator'
import { MultipartFile } from '@fastify/multipart'
import { IsFile } from './file.constraint'

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: '文件' })
  // 会检查属性是否为 undefined，但允许属性值为 null 或空值（如空字符串、空数组等
  @IsDefined()
  @IsFile(
    {
      mimetypes: ['image/png', 'image/gif', 'image/jpeg', 'image/webp', 'image/svg+xml'],
      fileSize: 1024 * 1024 * 10
    },
    {
      message: '文件类型不正确'
    }
  )
  file: MultipartFile
}
