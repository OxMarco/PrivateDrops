import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { User, UserSchema } from 'src/schemas/user';
import { Media, MediaSchema } from 'src/schemas/media';
import { View, ViewSchema } from 'src/schemas/view';
import { AwsModule } from 'src/aws/aws.module';
import { FileProcessor } from './file.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Media.name, schema: MediaSchema },
      { name: View.name, schema: ViewSchema },
    ]),
    BullModule.registerQueue({
      name: 'file',
    }),
    HttpModule,
    AwsModule,
  ],
  controllers: [MediaController],
  providers: [MediaService, FileProcessor],
})
export class MediaModule {}
