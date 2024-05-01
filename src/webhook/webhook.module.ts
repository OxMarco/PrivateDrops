import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { StripeModule } from 'src/stripe/stripe.module';
import { Media, MediaSchema } from 'src/schemas/media';
import { User, UserSchema } from 'src/schemas/user';
import { View, ViewSchema } from 'src/schemas/view';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Media.name, schema: MediaSchema },
      { name: View.name, schema: ViewSchema },
    ]),
    BullModule.registerQueue({
      name: 'mail',
    }),
    StripeModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
