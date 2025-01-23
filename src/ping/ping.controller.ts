import { Controller, Get } from '@nestjs/common';
import { PingService } from './ping.service';
import * as admin from 'firebase-admin';

@Controller('api/ping')
export class PingController {
  constructor(private readonly pingService: PingService) { }

  @Get()
  async ping() {
    try {
      await admin.firestore().collection('test').doc('ping').get();
      return {
        status: 'OK',
        details: {
          database: 'OK',
        },
      };
    } catch (error) {
      return {
        status: 'Partial',
        details: {
          database: 'KO',
        },
      };
    }
  }
}