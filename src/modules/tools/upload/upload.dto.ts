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
      mimetypes: [
        // 图片类
        'image/jpeg', // .jpg 或 .jpeg
        'image/png',
        'image/gif',
        'image/bmp',
        'image/svg+xml',
        'image/webp',
        // 文档类
        'text/plain', // .txt
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/pdf', // .pdf
        // 音频类
        'audio/mpeg', // .mp3
        'audio/wav', // .wav
        'audio/ogg', // .ogg
        'audio/flac', // .flac
        // 视频类
        'video/mp4', // .mp4
        'video/x-msvideo', // .avi
        'video/quicktime', // .mov
        'video/x-matroska', // .mkv
        // 压缩包类
        'application/zip', // .zip
        'application/x-rar-compressed', // .rar
        'application/x-7z-compressed', // .7z
      ],
      fileSize: 1024 * 1024 * 10
    },
    {
      message: '文件类型不正确'
    }
  )
  file: MultipartFile
}
