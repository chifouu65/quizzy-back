import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PingModule } from './ping/ping.module';

@Module({
  imports: [UsersModule, PingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
