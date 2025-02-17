import { DynamicModule, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import * as admin from 'firebase-admin';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
