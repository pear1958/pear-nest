import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'
import { DictItemDto, DictItemQueryDto } from './dict-item.dto'
import { DictItemEntity } from './dict-item.entity'
import { Pagination } from '@/helper/paginate/pagination'
import { paginate } from '@/helper/paginate'

@Injectable()
export class DictItemService {
  constructor(
    @InjectRepository(DictItemEntity) private dictItemRepository: Repository<DictItemEntity>
  ) {}

  /**
   * 列表
   */
  async list({
    page,
    pageSize,
    label,
    value,
    typeId
  }: DictItemQueryDto): Promise<Pagination<DictItemEntity>> {
    const queryBuilder = this.dictItemRepository
      .createQueryBuilder('dict_item')
      .orderBy({ orderNo: 'ASC' })
      .where({
        ...(label && { label: Like(`%${label}%`) }),
        ...(value && { value: Like(`%${value}%`) }),
        type: {
          id: typeId
        }
      })
    return paginate(queryBuilder, { page, pageSize })
  }

  /**
   * 新增
   */
  async create(dto: DictItemDto): Promise<void> {
    const { typeId, ...rest } = dto
    await this.dictItemRepository.insert({
      ...rest,
      type: {
        id: typeId
      }
    })
  }

  /**
   * 查询单个
   */
  async findOne(id: number): Promise<DictItemEntity> {
    return this.dictItemRepository.findOneBy({ id })
  }

  /**
   * 更新
   */
  async update(id: number, dto: Partial<DictItemDto>): Promise<void> {
    const { typeId, ...rest } = dto
    await this.dictItemRepository.update(id, {
      ...rest,
      type: {
        id: typeId
      }
    })
  }

  /**
   * 删除
   */
  async delete(id: number): Promise<void> {
    await this.dictItemRepository.delete(id)
  }
}
