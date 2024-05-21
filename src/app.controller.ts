import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Public } from './decorators/public';

@Controller()
export class AppController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private mongoose: MongooseHealthIndicator,
  ) {}

  @Public()
  @Get()
  index() {
    return { message: 'ok', time: new Date().toISOString() };
  }

  @Public()
  @Get('/status')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('self', 'https://app.privatedrops.me'),
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.7 }),
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      () => this.mongoose.pingCheck('mongoose'),
    ]);
  }

  @Public()
  @Get('/favicon.ico')
  favicon() {
    return null;
  }

  @Public()
  @Get('/robots.txt')
  robots() {
    return null;
  }
}
