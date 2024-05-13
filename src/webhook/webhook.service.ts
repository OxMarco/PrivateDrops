import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import { PaymentService } from 'src/payment/payment.service';
import { StripeService } from 'src/stripe/stripe.service';
import { getPaymentMailHtml } from 'src/sendgrid/payment.mail';
import { Media } from 'src/schemas/media';
import { User } from 'src/schemas/user';
import { View } from 'src/schemas/view';

@Injectable()
export class WebhookService {
  private logger: Logger;
  private appFee: number;

  constructor(
    private configService: ConfigService,
    private stripeService: StripeService,
    @InjectQueue('mail') private mailQueue: Queue,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    @InjectModel(View.name) private viewModel: Model<View>,
  ) {
    this.logger = new Logger(PaymentService.name);
    this.appFee = configService.get<number>('APP_FEE');
  }

  async handleWebhook(requestBody: any, signature: any) {
    const event = await this.stripeService.processWebhook(
      requestBody,
      signature,
    );

    if (event.type === 'checkout.session.completed') {
      await this.processCheckout(event);
    } else if (event.type === 'account.updated') {
      await this.processAccountUpdate(event);
    }
  }

  private async processCheckout(event: any) {
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
              media.owner.currency
            }`,
          );
          return;
        }

        user.payouts += payout;
        await user.save();

        const textMail = `Hi,\nsomeone has just seen your media and you earned ${(
          payout / 100
        ).toFixed(2)} ${media.owner.currency}!`;
        const htmlMail = getPaymentMailHtml(
          media.owner.currency,
          payout,
          'https://privatedrops.me/profile',
        );
        await this.mailQueue.add(
          {
            email: user.email,
            subject: 'PrivateDrops - media viewed',
            textMail,
            htmlMail,
          },
          { attempts: 3 },
        );
      }
    }
  }

  private async processAccountUpdate(event: any) {
    if (
      event.data.object.details_submitted &&
      event.data.object.payouts_enabled
    ) {
      const user = await this.userModel
        .findOne({ email: event.data.object.email })
        .exec();
      user.stripeVerified = true;
      await user.save();
    }
  }
}
