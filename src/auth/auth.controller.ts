import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { Recaptcha } from '@nestlab/google-recaptcha';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/dtos/login';
import { User } from 'src/schemas/user';
import { Public } from 'src/decorators/public';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Recaptcha()
  @Post('/login')
  async nonce(@Body() loginDto: LoginDto): Promise<void> {
    return await this.authService.generateNonce(loginDto);
  }

  @Public()
  @Get('/login/:code')
  async login(
    @Param('code') code: string,
    @Headers('x-forwarded-for') ip: string,
  ): Promise<User> {
    return await this.authService.login(code, ip);
  }
}
