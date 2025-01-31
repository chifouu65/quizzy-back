import { Controller, Get } from '@nestjs/common';
import { PingService } from './ping.service';

@Controller('api/ping')
export class PingController {
  constructor(private readonly pingService: PingService) {}

  @Get()
  ping() {
    return this.pingService.pong();
  }
}
