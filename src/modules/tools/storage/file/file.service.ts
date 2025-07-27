import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NetDiskFileEntity } from './file.entity'
import { FileMetadata } from './file.dto'

@Injectable()
export class NetDiskFileService {
  constructor(
    @InjectRepository(NetDiskFileEntity)
    private fileRepo: Repository<NetDiskFileEntity>
  ) {}

  /** 获取文件元数据 */
  async getMetadata(fileId: number): Promise<FileMetadata | null> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId },
      // select: ['id', 'name', 'size', 'extName', 'updatedAt', 'path']
    }) as any

    if (!file) return null

    return {
      id: file.id,
      name: file.name,
      size: file.size,
      extName: file.extName,
      updatedAt: file.updatedAt, // 用于生成Last-Modified
      path: file.path
    }
  }
}
