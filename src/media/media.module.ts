import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { User, UserSchema } from 'src/schemas/user';
import { Media, MediaSchema } from 'src/schemas/Media';
import { View, ViewSchema } from 'src/schemas/view';
import { AwsModule } from 'src/aws/aws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Media.name, schema: MediaSchema },
      { name: View.name, schema: ViewSchema },
    ]),
    AwsModule,
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
