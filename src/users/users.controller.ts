import { AuthGuard } from './../auth/auth.guard';
import { Controller, Get, UseGuards, Request, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { cp } from 'fs';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Request() req) {
    return this.usersService.me(req);
  }

  @Post()
  create(@Request() req) {
    return this.usersService.create(req);
  }
}
