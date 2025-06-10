import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { menuList } from 'src/mock/menuList'

@Injectable()
export class UserService {
  create(createUserDto: CreateUserDto) {
    console.log('createUserDto', createUserDto)
    return true
  }

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
