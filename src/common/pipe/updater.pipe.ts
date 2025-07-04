import { Inject, Injectable, PipeTransform } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { OperatorDto } from '../dto/operator.dto'

@Injectable()
export class UpdaterPipe implements PipeTransform {
  constructor(@Inject(REQUEST) private readonly request: any) {}

  transform(value: OperatorDto) {
    const user = this.request.user as AuthUser
    value.updateBy = user.uid
    return value
  }
}
