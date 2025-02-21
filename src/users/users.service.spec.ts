import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return user me', async () => {
    const req = {
      user: {
        id: '123',
      },
    };
    jest.spyOn(service, 'me').mockResolvedValue(req.user);
    const result = await service.me(req);
    expect(result).toEqual(req.user);
  });

  it('should create a user', async () => {
    const req = {
      body: {
        username: 'testuser',
        password: 'testpass',
      },
    };
    jest.spyOn(service, 'create').mockResolvedValue(req.body as any);
    const result = await service.create(req.body as any);
    expect(result).toEqual(req.body);
  });
});
