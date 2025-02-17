import { Test, TestingModule } from '@nestjs/testing';
import { PingService } from './ping.service';
import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  })),
}));

describe('PingService', () => {
  let service: PingService;
  let getMock: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PingService],
    }).compile();

    service = module.get<PingService>(PingService);
    getMock = jest.fn();
    jest.spyOn(admin, 'firestore').mockImplementation(
      () =>
        ({
          collection: () => ({
            doc: () => ({
              get: getMock,
            }),
          }),
        }) as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return OK when database responds', async () => {
    getMock.mockResolvedValueOnce({});
    const result = await service.pong();
    expect(result).toEqual({
      status: 'OK',
      details: { database: 'OK' },
    });
  });

  it('should return KO when database fails', async () => {
    getMock.mockRejectedValueOnce(new Error('Database error'));
    const result = await service.pong();
    expect(result).toEqual({
      status: 'Partial',
      details: { database: 'KO' },
    });
  });
});
