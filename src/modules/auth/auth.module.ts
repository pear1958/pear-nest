import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { CaptchaService } from './services/captcha.service'
import { TokenService } from './services/token.service'
import { AccessTokenEntity } from './entities/access-token.entity'
import { RefreshTokenEntity } from './entities/refresh-token.entity'
import { ConfigKeyPaths } from '@/config'
import { SecurityConfig } from '@/config/security.config'
import { isDev } from '@/utils/env.util'
import { UserModule } from '../system/user/user.module'
import { LogModule } from '../system/log/log.module'
import { CaptchaController } from './controllers/captcha.controller'
// import { LocalStrategy } from './strategies/local.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { AccountController } from './controllers/account.controller'
import { EmailController } from './controllers/email.controller'
import { RoleModule } from '../system/role/role.module'
import { MenuModule } from '../system/menu/menu.module'

const providers = [AuthService, CaptchaService, TokenService]
const strategies = [JwtStrategy] // LocalStrategy

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessTokenEntity, RefreshTokenEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        const { jwtSecret, jwtExprire } = configService.get<SecurityConfig>('security')
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: `${jwtExprire}s`
          },
          ignoreExpiration: isDev
        }
      },
      inject: [ConfigService]
    }),
    UserModule,
    RoleModule,
    MenuModule,
    // 需要使用 验证码日志服务(CaptchaLogService)
    // 比如在 自己的 CaptchaService 服务中就会用到
    LogModule
  ],
  controllers: [AuthController, CaptchaController, AccountController, EmailController],
  providers: [...providers, ...strategies],
  exports: [TypeOrmModule, JwtModule, ...providers]
})
export class AuthModule {}
