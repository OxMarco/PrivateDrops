import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/schemas/user';
import { ChangeNicknameDto } from 'src/dtos/change-nickname';
import { Public } from 'src/decorators/public';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getSelf(@Req() req: Request): Promise<User> {
    const userId: string = (req as any).id;

    return await this.userService.getSelf(userId);
  }

  @Public()
  @Get('/exists/:nickname')
  async checkNickname(@Param('nickname') nickname: string): Promise<boolean> {
    const user = await this.userService.getByNick(nickname);
    if (user) return true;
    else return false;
  }

  @Post()
  async update(@Body() changeNickname: ChangeNicknameDto): Promise<User> {
    return await this.userService.update(changeNickname);
  }
}
