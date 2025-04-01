import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Request } from '@nestjs/common';

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

  it('should return user me', () => {
    const mockReq = {
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
      },
    };

    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      username: 'testuser',
    };

    jest.spyOn(service, 'me').mockReturnValue(mockUser);

    const result = controller.me(mockReq);
    expect(result).toEqual(mockUser);
    expect(service.me).toHaveBeenCalledWith(mockReq);
  });
});
