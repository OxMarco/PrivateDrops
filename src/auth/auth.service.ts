import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { SendgridService } from 'src/sendgrid/sendgrid.service';
import { StripeService } from 'src/stripe/stripe.service';
import { LoginDto } from 'src/dtos/login';
import { User } from 'src/schemas/user';
import { HtmlEmailFields } from 'src/sendgrid/template.mail';

@Injectable()
export class AuthService {
  private logger: Logger;

  constructor(
    private jwtService: JwtService,
    private stripeService: StripeService,
    private sendgridService: SendgridService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.logger = new Logger(AuthService.name);
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
    const options: HtmlEmailFields = {
      header: '',
      paragraphOne: 'to log in on PrivateDrops use the following button',
      url: url,
      cta: 'Sign In',
      paragraphTwo: `or if the button doesn\'t work, use the following link <a href="${url}">${url}</a>`,
      salutation: 'Start earning now!',
      footer: 'A solution developed by Impossible Labs ltd',
    };

    await this.sendgridService.sendEmail(
      loginDto.email,
      'PrivateDrops - login link',
      textMail,
      options,
    );

    return { message: 'sent' };
  }

  async login(nonce: string, ip: string): Promise<any> {
    const user = await this.userModel.findOne({ nonce }).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    if (user.nonceExpiration.getTime() < Date.now())
      throw new BadRequestException({ error: 'Code expired' });

    if (!user.stripeAccountId) {
      try {
        const account = await this.stripeService.createAccount(
          user.id,
          user.email,
          ip,
        );
        user.stripeAccountId = account.id;
      } catch (err) {
        this.logger.error('Stripe account creation error', err);
        throw new BadRequestException({
          error: 'Stripe account creation error',
        });
      }
    }
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
