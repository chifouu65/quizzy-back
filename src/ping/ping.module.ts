import { Module } from '@nestjs/common';
import { PingService } from './ping.service';
import { PingController } from './ping.controller';

@Module({
  controllers: [PingController],
  providers: [PingService],
})
export class PingModule {}
