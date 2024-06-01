import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, UserSchema } from 'src/schemas/user';
import { Media, MediaSchema } from 'src/schemas/media';
import { View, ViewSchema } from 'src/schemas/view';
import { AwsModule } from 'src/aws/aws.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Media.name, schema: MediaSchema },
      { name: View.name, schema: ViewSchema },
    ]),
    AwsModule,
    StripeModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
