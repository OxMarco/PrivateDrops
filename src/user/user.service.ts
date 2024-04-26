import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChangeNicknameDto } from 'src/dtos/change-nickname';
import { User } from 'src/schemas/user';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getSelf(id: string): Promise<User> {
    return await this.userModel.findById(id).exec();
  }

  async getByNick(nick: string): Promise<User> {
    return await this.userModel.findOne({ nickname: nick }).exec();
  }

  async update(changeNickname: ChangeNicknameDto): Promise<User> {
    const found = await this.userModel
      .findOne({ nickname: changeNickname.nickname })
      .exec();
    if (found)
      throw new BadRequestException({ error: 'Nickname already in use' });

    const user = await this.userModel.findById(1).exec();
    user.nickname = changeNickname.nickname;
    await user.save();
    return user;
  }
}
