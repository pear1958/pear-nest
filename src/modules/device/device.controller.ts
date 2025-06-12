import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { DeviceService } from './device.service'
import { CreateDeviceDto } from './dto/create-device.dto'
import { UpdateDeviceDto } from './dto/update-device.dto'
import { ApiSecurityAuth } from '@/common/decorators/swagger'

@ApiSecurityAuth()
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto)
  }

  @Get('list')
  findAll() {
    return this.deviceService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deviceService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.deviceService.update(+id, updateDeviceDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceService.remove(+id)
  }
}
