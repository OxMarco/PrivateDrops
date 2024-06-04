import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger: Logger;
  private stripe: Stripe;
  private webhookSecret: string;
  private appFee: number;

  constructor(private configService: ConfigService) {
    this.logger = new Logger(StripeService.name);
    this.stripe = new Stripe(configService.get<string>('STRIPE_SECRET_KEY'));
    this.webhookSecret = configService.get<string>('STRIPE_WEBHOOK_SECRET');
    this.appFee = configService.get<number>('APP_FEE');
  }

  async getUserPayments(stripeAccountId: string) {
    try {
      const balanceInfo = await this.stripe.balance.retrieve({
        stripeAccount: stripeAccountId,
      });
      const balanceTransactions = await this.stripe.balanceTransactions.list({
        stripeAccount: stripeAccountId,
      });
      const payouts = await this.stripe.payouts.list({
        stripeAccount: stripeAccountId,
      });
      return { balanceInfo, balanceTransactions, payouts };
    } catch (err) {
      this.logger.error('Stripe error: ', err);
      throw new BadRequestException({
        error: 'Tax data retrieval unsuccessful',
      });
    }
  }

  async createCheckoutPage(
    stripeAccountId: string,
    nickname: string,
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
                name: 'Media file #' + code + ' shared by user ' + nickname,
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
          enabled: true,
        },
        tax_id_collection: {
          enabled: false,
        },
        invoice_creation: {
          enabled: false,
        },
        payment_intent_data: {
          application_fee_amount: price / this.appFee,
          capture_method: 'automatic',
          transfer_data: {
            destination: stripeAccountId,
          },
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
        country: 'IT',
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
          url: `https://privatedrops.me/profile/${userId}`,
        },
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

  async updateAccount(stripeAccountId: string, currency: string) {
    return await this.stripe.accounts.update(stripeAccountId, {
      default_currency: currency,
    });
  }

  async createLink(stripeAccountId: string) {
    try {
      return await this.stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: 'https://privatedrops.me/verified?success=false',
        return_url: 'https://privatedrops.me/verified?success=true',
        type: 'account_onboarding',
      });
    } catch (err) {
      this.logger.error('Stripe error: ', err);
      throw new BadRequestException({
        error: 'Onboarding link generation unsuccessful',
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
