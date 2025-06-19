import { Injectable } from '@nestjs/common'

@Injectable()
export class AuthService {
  login(username: string, password: string, ip: string, ua: string) {
    return 'xxxxxx'
  }
}
