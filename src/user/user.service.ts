import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { ChangeNicknameDto } from 'src/dtos/change-nickname';
import { ChangeCurrencyDto } from 'src/dtos/change-currency';
import { UserEntity } from 'src/entities/user';
import { User } from 'src/schemas/user';
import { Media } from 'src/schemas/media';
import { StripeService } from 'src/stripe/stripe.service';
import { CreateStripeAccountDto } from 'src/dtos/create-stripe-account';
import { SentryLogger } from 'src/sentry-logger';

@Injectable()
export class UserService {
  private logger: SentryLogger;
  private accessKey: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private stripeService: StripeService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Media.name) private mediaModel: Model<Media>,
  ) {
    this.logger = new SentryLogger(UserService.name);
    this.accessKey = configService.get<string>('EXCHANGE_RATE_API_KEY');
  }

  async getSelf(id: string): Promise<UserEntity> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      payouts: user.payouts,
      ratings: user.ratings,
      stripeAccountId: user?.stripeAccountId,
      stripeVerified: user.stripeVerified,
      banned: user.banned,
      currency: user.currency,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getByNick(nick: string): Promise<User> {
    return await this.userModel.findOne({ nickname: nick }).exec();
  }

  async updateNickname(
    id: string,
    changeNickname: ChangeNicknameDto,
  ): Promise<User> {
    const found = await this.userModel
      .findOne({ nickname: changeNickname.nickname })
      .exec();
    if (found)
      throw new BadRequestException({ error: 'Nickname already in use' });

    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    user.nickname = changeNickname.nickname;
    await user.save();
    return user;
  }

  async updateCurrency(
    id: string,
    changeCurrency: ChangeCurrencyDto,
  ): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    if (user.currency === changeCurrency.currency) return user;

    // update all user media prices converting currencies accordingly
    const userMedia = await this.mediaModel.find({ owner: id }).exec();
    for (const media of userMedia) {
      media.price = await this.convertCurrencyAndRound(
        user.currency,
        changeCurrency.currency,
        media.price,
      );
      await media.save();
    }

    user.currency = changeCurrency.currency;
    await user.save();

    await this.stripeService.updateAccount(
      user.stripeAccountId,
      changeCurrency.currency,
    );

    return user;
  }

  async createStripeAccount(
    id: string,
    ip: string,
    createStripeAccount: CreateStripeAccountDto,
  ) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    if (!user.stripeAccountId) {
      this.logger.log('Creating a new Stripe account for this user');
      try {
        const account = await this.stripeService.createAccount(
          user.id,
          user.email,
          createStripeAccount.country,
          ip,
        );
        user.stripeAccountId = account.id;
        await user.save();
      } catch (err) {
        this.logger.error('Stripe account creation error', err);
        throw new BadRequestException({
          error: 'Stripe account creation error',
        });
      }
    } else {
      throw new BadRequestException({ error: 'Account already created' });
    }
  }

  private async convertCurrencyAndRound(
    from: string,
    to: string,
    amount: number,
  ): Promise<number> {
    const url =
      'https://api.exchangeratesapi.io/v1/convert?access_key=' +
      this.accessKey +
      '&from=' +
      from +
      '&to=' +
      to +
      '&amount=' +
      amount;
    const response = await lastValueFrom(this.httpService.get(url));
    return Math.ceil(response.data.result);
  }
}
