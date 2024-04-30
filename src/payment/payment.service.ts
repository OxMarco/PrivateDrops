import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Media } from 'src/schemas/media';
import { User } from 'src/schemas/user';
import { View } from 'src/schemas/view';
import { SendgridService } from 'src/sendgrid/sendgrid.service';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class PaymentService {
  private logger: Logger;
  private appFee: number;

  constructor(
    private configService: ConfigService,
    private stripeService: StripeService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    @InjectModel(View.name) private viewModel: Model<View>,
  ) {
    this.logger = new Logger(PaymentService.name);
    this.appFee = configService.get<number>('APP_FEE') || 0;
  }

  private async getUserView(media: Media, ip: string) {
    const found = media.views.find((view) => view.ip === ip);
    if (!found) return { userView: null, hasPaid: false };

    const userView = await this.viewModel.findById((found as any)._id).exec();
    return { userView, hasPaid: userView.payment };
  }

  async getKycLink(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });
    const link = await this.stripeService.createLink(user.stripeAccountId);
    return link.url;
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
      String(media.owner._id),
      media.code,
      media.price,
      media.currency,
      media.blurredUrl,
      { mediaId: media.id, code: media.code, ip },
      redirectUrlSuccess,
      redirectUrlCancel,
    );

    return url;
  }

  async webhook(requestBody: any, signature: any) {
    const event = await this.stripeService.processWebhook(
      requestBody,
      signature,
    );

    if (event.type === 'checkout.session.completed') {
      const session = await this.stripeService.retrieve(event, []);
      if (session.payment_status == 'paid') {
        const media = await this.mediaModel
          .findById(session.metadata.mediaId)
          .populate('owner')
          .exec();

        if (media) {
          const view = await this.viewModel.create({
            ip: session.metadata.ip,
            payment: true,
          });
          media.views.push(view);
          media.markModified('views');
          await media.save();

          const user = await this.userModel
            .findById((media.owner as any)._id)
            .exec();

          const feeInCents = Math.round((media.price * this.appFee) / 100);
          const payout = media.price - feeInCents;

          if (!user) {
            this.logger.error(
              `User ${String((media.owner as any).id)} owner of ${
                media.id
              } not found, owed ${media.price} (-${feeInCents} fee) ${
                media.currency
              }`,
            );
            return;
          }

          user.payouts += payout;
          await user.save();
        }
      }
    }
  }
}
