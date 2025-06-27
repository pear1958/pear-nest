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
import { UserModule } from '../user/user.module'

const providers = [AuthService, CaptchaService, TokenService]

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
    UserModule
  ],
  controllers: [AuthController],
  providers: [...providers],
  exports: [TypeOrmModule, JwtModule, ...providers]
})
export class AuthModule {}
