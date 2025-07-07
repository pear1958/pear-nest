import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'
import { DictTypeEntity } from './dict-type.entity'
import { DictTypeDto, DictTypeQueryDto } from './dict-type.dto'
import { Pagination } from '@/helper/paginate/pagination'
import { paginate } from '@/helper/paginate'

@Injectable()
export class DictTypeService {
  constructor(
    @InjectRepository(DictTypeEntity) private dictTypeRepository: Repository<DictTypeEntity>
  ) {}

  /**
   * 列表
   */
  async list({
    page,
    pageSize,
    name,
    code
  }: DictTypeQueryDto): Promise<Pagination<DictTypeEntity>> {
    const queryBuilder = this.dictTypeRepository.createQueryBuilder('dict_type').where({
      ...(name && { name: Like(`%${name}%`) }),
      ...(code && { code: Like(`%${code}%`) })
    })
    return paginate(queryBuilder, { page, pageSize })
  }

  /**
   * 一次性获取所有的字典类型
   */
  async getAll() {
    return this.dictTypeRepository.find()
  }

  /**
   * 获取参数总数
   */
  // async countConfigList(): Promise<number> {
  //   return this.dictTypeRepository.count()
  // }

  /**
   * 新增
   */
  async create(dto: DictTypeDto): Promise<void> {
    await this.dictTypeRepository.insert(dto)
  }

  /**
   * 查询单个
   */
  async findOne(id: number): Promise<DictTypeEntity> {
    return this.dictTypeRepository.findOneBy({ id })
  }

  /**
   * 更新
   */
  async update(id: number, dto: Partial<DictTypeDto>): Promise<void> {
    await this.dictTypeRepository.update(id, dto)
  }

  /**
   * 删除
   */
  async delete(id: number): Promise<void> {
    await this.dictTypeRepository.delete(id)
  }
}
