declare global {
  interface BaseResponse<T = any> {
    message: string
    code: number
    data?: T
  }

  interface AuthUser {
    uid: number
    pv: number
    exp?: number // 过期时间
    iat?: number // 签发时间
    roles?: string[]
  }
}

export {}
