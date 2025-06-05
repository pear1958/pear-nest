import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { menuList } from 'src/mock/menuList'

@Injectable()
export class UserService {
  create(createUserDto: CreateUserDto) {
    console.log('createUserDto', createUserDto)
    return {
      code: 200,
      msg: 'ok',
      data: true
    }
  }

  findAll() {
    return {
      code: 200,
      msg: 'ok',
      data: menuList
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} user`
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`
  }

  remove(id: number) {
    return `This action removes a #${id} user`
  }
}
