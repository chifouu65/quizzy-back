import { Test, TestingModule } from '@nestjs/testing';

import { PingController } from './ping.controller';
import { PingService } from './ping.service';

describe('PingController', () => {
  let controller: PingController;
  let service: PingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PingController],
      providers: [PingService],
    }).compile();

    controller = module.get<PingController>(PingController);
    service = module.get<PingService>(PingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return success response', async () => {
    const response = { status: 'OK', details: { database: 'OK' } };
    jest.spyOn(service, 'pong').mockResolvedValue(response);

    expect(await controller.ping()).toEqual(response);
  });

  it('should return error response', async () => {
    const error = {
      status: 'Partial',
      details: {
        database: 'KO',
      },
    };
    jest.spyOn(service, 'pong').mockRejectedValue(error);

    await expect(controller.ping()).rejects.toEqual(error);
  });
});
