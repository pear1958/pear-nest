import { AuthStrategy } from '@/constant/auth.constant'
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthService } from '../auth.service'

/**
 * 本地认证策略：处理用户名密码登录
 * 处理流程：
 * 1. 从请求体中提取用户名和密码
 * 2. 调用 AuthService 验证用户
 * 3. 返回验证后的用户对象或抛出异常
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(
  // 使用 passport-local 策略
  Strategy,
  // 策略名称，用于 @UseGuards(AuthGuard('local')) | extends AuthGuard('local')
  AuthStrategy.LOCAL
) {
  constructor(private authService: AuthService) {
    super({
      // 指定请求体中用户名和密码的字段名
      // 默认是 'username' 和 'password'，这里修改为 'credential' 和 'password'
      usernameField: 'credential',
      passwordField: 'password'
    })
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password)
    // Passport 会将此对象赋值给请求对象的 user 属性（req.user）
    return user
  }
}
