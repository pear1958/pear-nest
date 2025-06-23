import { Injectable } from '@nestjs/common'
import { UserService } from '../user/user.service'
import { isEmpty } from 'lodash-es'
import { BusinessException } from '@/common/exception/business.exception'
import { ErrorEnum } from '@/constant/error-code.constant'

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  /**
   * 获取登录JWT
   * 返回null则账号密码有误, 不存在该用户
   */
  async login(username: string, password: string, ip: string, ua: string) {
    const user = await this.userService.findUserByUserName(username)

    // 用户名不存在
    if (isEmpty(user)) {
      throw new BusinessException(ErrorEnum.INVALID_USERNAME_PASSWORD)
    }

    return 'xxxxxx'
  }
}
