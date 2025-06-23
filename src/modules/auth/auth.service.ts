import { Injectable } from '@nestjs/common'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  /**
   * 获取登录JWT
   * 返回null则账号密码有误, 不存在该用户
   */
  async login(username: string, password: string, ip: string, ua: string) {
    const user = await this.userService.findUserByUserName(username)
    return 'xxxxxx'
  }
}
