import { Injectable } from '@nestjs/common'
import { CreateDeviceDto } from './dto/create-device.dto'
import { UpdateDeviceDto } from './dto/update-device.dto'

@Injectable()
export class DeviceService {
  create(createDeviceDto: CreateDeviceDto) {
    return 'This action adds a new device'
  }

  findAll() {
    return {
      code: 200,
      msg: 'ok',
      data: [
        {
          name: '111',
          type: 'aaa'
        },
        {
          name: '222',
          type: 'bbb'
        }
      ]
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} device`
  }

  update(id: number, updateDeviceDto: UpdateDeviceDto) {
    return `This action updates a #${id} device`
  }

  remove(id: number) {
    return `This action removes a #${id} device`
  }
}
