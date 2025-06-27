import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { menuList } from '@/mock/menuList'
import { UserEntity } from './entities/user.entity'

enum UserStatus {
  Disable = 0,
  Enabled = 1
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>
  ) {}

  findAll() {
    return menuList
  }

  getUserInfo() {
    return {
      userName: 'Admin',
      mobile: '18270993095',
      apartment: 'IT服务部',
      avatar: 'xxx',
      salary: 4500
    }
  }

  getAuthButton() {
    return {
      home: ['test1', 'add', 'delete', 'edit', 'query', '一键导出', '一键删除'],
      jsonForm: ['设备列表1', '设备列表2'],
      jsonTable: ['add', 'delete', 'query', 'salary']
    }
  }

  async findUserByUserName(username: string): Promise<UserEntity | undefined> {
    return this.userRepository
      .createQueryBuilder('user')
      .where({
        username,
        status: UserStatus.Enabled
      })
      .getOne()
  }
}
