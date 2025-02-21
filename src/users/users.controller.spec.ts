import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return user me', async () => {
    const req = {
      user: {
        id: '123',
      },
    };
    jest.spyOn(service, 'me').mockResolvedValue(req.user);
    const result = await controller.me(req);
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
    const result = await controller.create(req);
    expect(result).toEqual(req.body);
  });
});
