import { Module, Provider } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { join } from 'node:path'
import { ConfigKeyPaths } from '@/config'
import { AppConfig } from '@/config/app.config'
import { MailerService } from './mailer.service'
import { MailerConfig } from '@/config/mailer.config'

const providers: Provider<any>[] = [MailerService]

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      // 注册提供者, 并使其可被注入
      // 两者缺一不可，共同实现了依赖注入的完整流程
      imports: [ConfigModule],
      // 注入 ConfigService 以便在工厂函数中使用
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        transport: configService.get<MailerConfig>('mailer'),
        defaults: {
          from: {
            // 发件人名称 Pear-Admin
            name: configService.get<AppConfig>('app').name,
            // 发件人地址 nest_admin@163.com
            address: configService.get<MailerConfig>('mailer').auth.user
          }
        },
        template: {
          // 定义邮件模板的目录，使用 join 函数拼接路径
          dir: join(__dirname, '..', '..', '/assets/templates'),
          // 使用 Handlebars 模板引擎
          adapter: new HandlebarsAdapter(),
          // 启用严格模式
          options: {
            strict: true
          }
        }
      })
    })
  ],
  providers,
  exports: providers
})
export class MailerModule {}
