import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../schemas/user';
import { Media, MediaSchema } from '../schemas/Media';
import { View, ViewSchema } from '../schemas/view';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Media.name, schema: MediaSchema },
      { name: View.name, schema: ViewSchema },
    ]),
    AwsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
