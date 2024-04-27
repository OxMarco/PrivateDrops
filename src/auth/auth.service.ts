import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { SendgridService } from 'src/sendgrid/sendgrid.service';
import { LoginDto } from 'src/dtos/login';
import { User } from 'src/schemas/user';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private sendgridService: SendgridService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async generateNonce(loginDto: LoginDto): Promise<any> {
    const nonce = randomBytes(6).toString('hex').toUpperCase();
    const nonceExpiration = new Date(Date.now() + 15 * 60 * 1000);
    let user = await this.userModel.findOne({ email: loginDto.email }).exec();
    if (!user) {
      user = await this.userModel.create({
        email: loginDto.email,
        nonce,
        nonceExpiration,
      });
    } else {
      user.nonce = nonce;
      user.nonceExpiration = nonceExpiration;
      await user.save();
    }

    const textMail = `Welcome to PrivateDrops!\nUse the following link https://privatedrops.me/login/${nonce} to log in`;
    //const htmlMail = this.sendgridService.loadHtmlTemplate({ nonce }, 'login.html')
    await this.sendgridService.sendEmail(
      loginDto.email,
      'PrivateDrops - login link',
      textMail,
      '',
    ); //htmlMail)

    return { message: 'sent' };
  }

  async login(nonce: string): Promise<any> {
    const user = await this.userModel.findOne({ nonce }).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    if (user.nonceExpiration.getTime() < Date.now())
      throw new BadRequestException({ error: 'Code expired' });

    user.nonceExpiration = new Date(0); // save an invalid date to prevent double login
    await user.save();

    return {
      id: user.id,
      nickname: user.nickname,
      accessToken: await this.jwtService.signAsync({
        id: user.id,
      }),
    };
  }
}
