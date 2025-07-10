import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MultipartFile } from '@fastify/multipart'
import { isNil } from 'lodash'
import dayjs from 'dayjs'
import {
  fileRename,
  getExtname,
  getFilePath,
  getFileType,
  getSize,
  saveLocalFile
} from '@/utils/file.util'
import { StorageEntity } from '../storage/storage.entity'

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(StorageEntity) private storageRepository: Repository<StorageEntity>
  ) {}

  /**
   * 保存文件上传记录
   */
  async saveFile(file: MultipartFile, userId: number): Promise<string> {
    if (isNil(file)) {
      throw new NotFoundException('Have not any file to upload!')
    }

    const fileName = file.filename
    const size = getSize(file.file.bytesRead)
    const extName = getExtname(fileName)
    const type = getFileType(extName)
    // 文件重命名
    const name = fileRename(fileName)
    const currentDate = dayjs().format('YYYY-MM-DD')
    const path = getFilePath(name, currentDate, type)

    saveLocalFile(await file.toBuffer(), name, currentDate, type)

    await this.storageRepository.save({
      name,
      fileName,
      extName,
      path,
      type,
      size,
      userId
    })

    return path
  }
}
