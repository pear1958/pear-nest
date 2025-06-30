import { Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { SecurityConfig, securityConfig } from '@/config/security.config'
import { AuthStrategy } from '@/constant/auth.constant'

/**
 * JWT 认证策略：验证 HTTP 请求中的 JWT Token
 * 处理流程：
 * 1.从请求头中提取 JWT
 * 2.使用密钥验证签名和时效性
 * 3.解析 Token 中的用户信息
 * 4.将用户信息挂载到请求对象上 (req.user)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AuthStrategy.JWT) {
  constructor(@Inject(securityConfig.KEY) private securityConfig: SecurityConfig) {
    super({
      // 从请求头中提取 JWT，格式为: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 不忽略过期时间
      ignoreExpiration: false,
      // 用于验证 JWT 签名的密钥（从配置中获取）
      secretOrKey: securityConfig.jwtSecret
    })
  }

  /**
   * JWT 验证通过后的回调函数
   * @param payload - 从 JWT 中解析出的用户信息（载荷部分）
   * @returns 返回的对象将被挂载到请求对象的 user 属性上
   */
  async validate(payload: AuthUser) {
    // NestJS 会自动将其挂载到请求对象上，后续可通过 @Request() req 访问
    return payload
  }
}
