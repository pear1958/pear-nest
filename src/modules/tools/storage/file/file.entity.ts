import { CommonEntity } from '@/common/entity/common.entity'
import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity } from 'typeorm'

@Entity({ name: 'netdisk_file' })
export class NetDiskFileEntity extends CommonEntity {
  @Column({ type: 'varchar', length: 255, comment: '文件名称' })
  @ApiProperty({ description: '文件名称' })
  name: string

  @Column({ name: 'file_path', type: 'varchar', length: 512, comment: '文件存储路径' })
  @ApiProperty({ description: '文件存储路径' })
  filePath: string

  @Column({ name: 'file_size', type: 'bigint', comment: '文件大小（字节）' })
  @ApiProperty({ description: '文件大小（字节）' })
  fileSize: number

  @Column({
    name: 'mime_type',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '文件MIME类型'
  })
  @ApiProperty({ description: '文件MIME类型' })
  mimeType: string

  @Column({
    name: 'hash',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: '文件内容哈希（用于生成ETag）'
  })
  @ApiProperty({ description: '文件内容哈希' })
  hash: string

  @Column({ name: 'user_id', type: 'int', comment: '所属用户ID' })
  @ApiProperty({ description: '所属用户ID' })
  userId: number
}
