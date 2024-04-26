import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      configService.get<string>('STRIPE_SECRET_KEY') || '',
    );
  }

  async processCharge(amount: number, tok: string) {
    try {
      const charge = await this.stripe.charges.create({
        amount, // amount in cents
        currency: 'usd',
        source: tok,
        description: 'PrivateDrops media view',
      });
      return charge;
    } catch (err) {
      throw new BadRequestException({ error: 'Payment unsuccessful' });
    }
  }
}
