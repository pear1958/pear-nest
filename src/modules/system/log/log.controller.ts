import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

@Controller('log')
export class LogController {
  constructor() {}

  @Post()
  create() {
    return 'xxx';
  }
}
