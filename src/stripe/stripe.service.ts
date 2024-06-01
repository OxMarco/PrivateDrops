import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger: Logger;
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.logger = new Logger(StripeService.name);
    this.stripe = new Stripe(configService.get<string>('STRIPE_SECRET_KEY'));
    this.webhookSecret = configService.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  async createCheckoutPage(
    userId: string,
    code: string,
    price: number,
    currency: string,
    img: string,
    metadata: any,
    redirectSuccess: string,
    redirectCancel: string,
  ) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              tax_behavior: 'exclusive',
              currency,
              product_data: {
                name: 'Media file #' + code,
                images: [img],
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: redirectSuccess,
        cancel_url: redirectCancel,
        automatic_tax: {
          enabled: false,
        },
        payment_intent_data: {
          transfer_group: userId,
          capture_method: 'automatic',
        },
        metadata,
      });
      return session.url;
    } catch (err) {
      this.logger.error('Stripe error: ', err);
      throw new BadRequestException({ error: 'Payment unsuccessful' });
    }
  }

  async processWebhook(
    requestBody: any,
    signature: any,
  ): Promise<Stripe.Event> {
    return this.stripe.webhooks.constructEvent(
      requestBody,
      signature,
      this.webhookSecret,
    );
  }

  async retrieve(event: any, expand: string[]) {
    return await this.stripe.checkout.sessions.retrieve(event.data.object.id, {
      expand,
    });
  }

  async createAccount(userId: string, email: string, ip: string) {
    try {
      return await this.stripe.accounts.create({
        email,
        controller: {
          losses: {
            payments: 'application',
          },
          fees: {
            payer: 'application',
          },
          stripe_dashboard: {
            type: 'none',
          },
          requirement_collection: 'application',
        },
        capabilities: {
          card_payments: {
            requested: true,
          },
          transfers: {
            requested: true,
          },
        },
        business_type: 'individual',
        business_profile: {
          mcc: '5815', // digital_goods_media
          url: `https://privatedrops.me/users/${userId}`,
        },
        country: 'IT',
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip,
        },
      });
    } catch (err) {
      this.logger.error('Stripe error: ', err);
      throw new BadRequestException({ error: 'Account creation error' });
    }
  }

  async createLink(stripeAccountId: string) {
    try {
      return await this.stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: 'https://privatedrops.me/profile?verification=false',
        return_url: 'https://privatedrops.me/profile?verification=true',
        type: 'account_onboarding',
      });
    } catch (err) {
      this.logger.error('Stripe error: ', err);
      throw new BadRequestException({
        error: 'KYC link generation unsuccessful',
      });
    }
  }

  async payout(accountId: string, currency: string, amount: number) {
    try {
      return await this.stripe.transfers.create({
        amount,
        currency,
        destination: accountId,
        description: 'Collective payout for PrivateDrops media sales',
      });
    } catch (err) {
      this.logger.error('Stripe error: ', err);
      throw new BadRequestException({ error: 'Payout request unsuccessful' });
    }
  }
}
