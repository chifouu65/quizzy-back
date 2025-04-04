import { Module } from '@nestjs/common';
import { PingService } from './ping.service';
import { PingController } from './ping.controller';

@Module({
  controllers: [PingController],
  providers: [PingService],
  exports: [PingService], // Export PingService for use in other modules
})
export class PingModule {}
