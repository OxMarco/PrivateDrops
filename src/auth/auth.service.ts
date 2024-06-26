import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import { randomBytes } from 'crypto';
import { LoginDto } from 'src/dtos/login';
import { User } from 'src/schemas/user';
import { getLoginMailHtml } from 'src/sendgrid/login.mail';
import { SentryLogger } from 'src/sentry-logger';

@Injectable()
export class AuthService {
  private logger: SentryLogger;

  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {
    this.logger = new SentryLogger(AuthService.name);
  }

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

    const url = `https://privatedrops.me/login/${nonce}`;
    const textMail = `Hi!\nuse the following link ${url} to sign in on PrivateDrops`;
    const htmlMail = getLoginMailHtml(url);
    await this.mailQueue.add(
      {
        email: loginDto.email,
        subject: 'PrivateDrops - login link',
        textMail,
        htmlMail,
      },
      { attempts: 3 },
    );
  }

  async login(nonce: string): Promise<any> {
    const user = await this.userModel.findOne({ nonce }).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    if (user.nonceExpiration.getTime() < Date.now())
      throw new BadRequestException({ error: 'Code expired' });

    if (user.banned)
      throw new UnauthorizedException({ error: 'User has been banned' });

    user.nonceExpiration = new Date(0); // save an invalid date to prevent code reuse
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
