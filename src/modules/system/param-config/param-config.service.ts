import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ParamConfigEntity } from './param-config.entity'

@Injectable()
export class ParamConfigService {
  constructor(
    @InjectRepository(ParamConfigEntity)
    private paramConfigRepository: Repository<ParamConfigEntity>
  ) {}

  async findValueByKey(key: string): Promise<string | null> {
    const result = await this.paramConfigRepository.findOne({
      where: { key },
      select: ['value']
    })
    if (result) return result.value
    return null
  }
}
