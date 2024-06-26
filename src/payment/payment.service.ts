import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Media } from 'src/schemas/media';
import { User } from 'src/schemas/user';
import { View } from 'src/schemas/view';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class PaymentService {
  constructor(
    private stripeService: StripeService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    @InjectModel(View.name) private viewModel: Model<View>,
  ) {}

  private async getUserView(media: Media, ip: string) {
    const found = media.views.find((view) => view.ip === ip);
    if (!found) return { userView: null, hasPaid: false };

    const userView = await this.viewModel.findById(found._id).exec();
    return { userView, hasPaid: userView.payment };
  }

  async getKycLink(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    if (!user.stripeAccountId)
      throw new BadRequestException({ error: 'Create a Stripe account first' });
    const link = await this.stripeService.createLink(user.stripeAccountId);
    return link.url;
  }

  async getPayoutsInfo(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    return await this.stripeService.getUserPayments(user.stripeAccountId);
  }

  async verifyPayment(code: string, ip: string): Promise<boolean> {
    const media = await this.mediaModel
      .findOne({ code })
      .populate('views')
      .exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });
    const { hasPaid } = await this.getUserView(media, ip);
    return hasPaid;
  }

  async getCheckoutLink(
    code: string,
    redirectUrlSuccess: string,
    redirectUrlCancel: string,
    ip: string,
  ) {
    const media: any = await this.mediaModel
      .findOne({ code })
      .populate('views')
      .populate('owner')
      .exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });

    const { hasPaid } = await this.getUserView(media, ip);
    if (hasPaid)
      throw new BadRequestException({
        error: 'User has already paid to view this media file',
      });

    if (media.singleView && media.views.length > 0)
      throw new BadRequestException({ error: 'Max views reached' });

    const url = await this.stripeService.createCheckoutPage(
      media.owner.stripeAccountId,
      media.owner.nickname,
      media.code,
      media.price,
      media.owner.currency,
      media.blurredUrl,
      { mediaId: media.id, code: media.code, ip },
      redirectUrlSuccess,
      redirectUrlCancel,
    );

    return url;
  }

  async requestPayout(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException({ error: 'User not found' });
    if (user.payouts < 2000)
      throw new BadRequestException({
        error: 'Need to have at least $20 or similar',
      });

    const response = await this.stripeService.payout(
      user.stripeAccountId,
      user.currency,
      user.payouts,
    );
    return response.id;
  }
}
