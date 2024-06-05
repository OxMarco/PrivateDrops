import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { User } from 'src/schemas/user';
import { ChangeNicknameDto } from 'src/dtos/change-nickname';
import { ChangeCurrencyDto } from 'src/dtos/change-currency';
import { Public } from 'src/decorators/public';
import { UserEntity } from 'src/entities/user';
import { CreateStripeAccountDto } from 'src/dtos/create-stripe-account';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getSelf(@Req() req: Request): Promise<UserEntity> {
    const userId: string = req.id;

    return await this.userService.getSelf(userId);
  }

  @Post('/stripe')
  async createStripeAccount(
    @Req() req: Request,
    @Headers('x-forwarded-for') ip: string,
    @Body() createStripeAccount: CreateStripeAccountDto,
  ) {
    const userId: string = req.id;

    return await this.userService.createStripeAccount(
      userId,
      ip,
      createStripeAccount,
    );
  }

  @Public()
  @Get('/exists/:nickname')
  async checkNickname(@Param('nickname') nickname: string): Promise<boolean> {
    const user = await this.userService.getByNick(nickname);
    if (user) return true;
    else return false;
  }

  @Post('/nickname')
  async updateNickname(
    @Body() changeNickname: ChangeNicknameDto,
    @Req() req: Request,
  ): Promise<User> {
    const userId: string = req.id;

    return await this.userService.updateNickname(userId, changeNickname);
  }

  @Post('/currency')
  async updateCurrency(
    @Body() changeCurrency: ChangeCurrencyDto,
    @Req() req: Request,
  ): Promise<User> {
    const userId: string = req.id;

    return await this.userService.updateCurrency(userId, changeCurrency);
  }
}
