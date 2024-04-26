import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dtos/login';
import { User } from '../schemas/user';
import { Public } from '../decorators/public';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/login')
  async nonce(@Body() loginDto: LoginDto): Promise<void> {
    return await this.authService.generateNonce(loginDto);
  }

  @Public()
  @Get('/login/:code')
  async login(@Param('code') code: string): Promise<User> {
    return await this.authService.login(code);
  }
}
