import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { CreateAuthDto } from './dto/create-auth.dto'
import { UpdateAuthDto } from './dto/update-auth.dto'
import { ApiResult } from '@/common/decorators/api-result'
import { LoginToken } from '@/common/model/auth'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '登录' })
  @ApiResult({ type: LoginToken })
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto)
  }

  @Get()
  findAll() {
    return this.authService.findAll()
  }

  @Get(':id')
  @ApiOperation({ description: '这是一段测试文案' })
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id)
  }
}
