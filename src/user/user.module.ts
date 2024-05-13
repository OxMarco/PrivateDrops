import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule, HttpService } from '@nestjs/axios';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from 'src/schemas/user';
import { Media, MediaSchema } from 'src/schemas/media';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Media.name, schema: MediaSchema },
    ]),
    StripeModule,
    HttpModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
