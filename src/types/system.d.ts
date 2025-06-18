declare global {
  export interface BaseResponse<T = any> {
    message: string
    code: number
    data?: T
  }
}

export {}
