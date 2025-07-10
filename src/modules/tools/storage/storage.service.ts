import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, Like, Repository } from 'typeorm'
import { StorageEntity } from './storage.entity'
import { UserEntity } from '@/modules/system/user/user.entity'
import { StorageCreateDto, StoragePageDto } from './storage.dto'
import { Pagination } from '@/helper/paginate/pagination'
import { StorageInfo } from './storage.model'
import { paginateRaw } from '@/helper/paginate'
import { PaginationTypeEnum } from '@/helper/paginate/type'
import { deleteFile } from '@/utils/file.util'

@Injectable()
export class StorageService {
  constructor(
    @InjectRepository(StorageEntity) private storageRepository: Repository<StorageEntity>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>
  ) {}

  async list({
    page,
    pageSize,
    name,
    type,
    size,
    extName,
    time,
    username
  }: StoragePageDto): Promise<Pagination<StorageInfo>> {
    const queryBuilder = this.storageRepository
      .createQueryBuilder('storage')
      .leftJoinAndSelect('sys_user', 'user', 'storage.user_id = user.id')
      .where({
        ...(name && { name: Like(`%${name}%`) }),
        ...(type && { type }),
        ...(extName && { extName }),
        ...(size && { size: Between(size[0], size[1]) }),
        ...(time && { createdAt: Between(time[0], time[1]) }),
        ...(username && {
          userId: (await this.userRepository.findOneBy({ username }))?.id
        })
      })
      .orderBy('storage.created_at', 'DESC')

    const { items, ...rest } = await paginateRaw<StorageEntity>(queryBuilder, {
      page,
      pageSize,
      paginationType: PaginationTypeEnum.LIMIT_AND_OFFSET
    })

    function formatResult(result: StorageEntity[]) {
      return result.map((e: any) => {
        return {
          id: e.storage_id,
          name: e.storage_name,
          extName: e.storage_ext_name,
          path: e.storage_path,
          type: e.storage_type,
          size: e.storage_size,
          createdAt: e.storage_created_at,
          username: e.user_username
        }
      })
    }

    return {
      items: formatResult(items),
      ...rest
    }
  }

  async create(dto: StorageCreateDto, userId: number): Promise<void> {
    await this.storageRepository.save({
      ...dto,
      userId
    })
  }

  /**
   * 删除文件
   */
  async delete(fileIds: number[]): Promise<void> {
    await this.storageRepository.delete(fileIds)
    const items = await this.storageRepository.findByIds(fileIds)
    items.forEach(el => deleteFile(el.path))
  }

  async count(): Promise<number> {
    return this.storageRepository.count()
  }
}
