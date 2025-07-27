import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString, IsDate } from 'class-validator'

export class FileMetadata {
  @ApiProperty({ description: '文件ID' })
  @IsNumber()
  id: number

  @ApiProperty({ description: '文件名' })
  @IsString()
  name: string

  @ApiProperty({ description: '文件大小（字节）' })
  @IsNumber()
  size: number

  @ApiProperty({ description: '文件扩展名' })
  @IsString()
  extName: string

  @ApiProperty({ description: '最后修改时间' })
  @IsDate()
  updatedAt: Date

  @ApiProperty({ description: '文件路径' })
  @IsString()
  path: string
}
