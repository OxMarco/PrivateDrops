import { Controller, Get } from '@nestjs/common';
import { Public } from './decorators/public';

@Controller()
export class AppController {
  @Public()
  @Get()
  index() {
    return { message: 'ok', time: new Date().toISOString() };
  }

  @Public()
  @Get('/favicon.ico')
  favicon() {
    return null;
  }
}
