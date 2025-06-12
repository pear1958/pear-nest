import { type ConfigType, registerAs } from '@nestjs/config'

export const app = 'app'

export const appConfig = registerAs(app, () => ({
  aaa: 'aaa',
  bbb: 'bbb'
}))

export type AppConfig = ConfigType<typeof appConfig>
