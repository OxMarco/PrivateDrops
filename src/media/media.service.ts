import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import * as bcrypt from 'bcrypt';
import sharp from 'sharp';
import { AwsService } from 'src/aws/aws.service';
import { View } from 'src/schemas/view';
import { User } from 'src/schemas/user';
import { Media } from 'src/schemas/media';
import { CreateMediaDto } from 'src/dtos/create-media';
import { MediaEntity } from 'src/entities/media';
import { LeaveFeedbackDto } from 'src/dtos/leave-feedback';

@Injectable()
export class MediaService {
  private logger: Logger;

  constructor(
    private configService: ConfigService,
    private awsService: AwsService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    @InjectModel(View.name) private viewModel: Model<View>,
    @InjectQueue('media') private mediaQueue: Queue,
  ) {
    this.logger = new Logger(MediaService.name);
  }

  private async getUserView(media: Media, ip: string) {
    const found = media.views.find((view) => view.ip === ip);
    if (!found) return { userView: null, hasPaid: false };

    const userView = await this.viewModel.findById(found._id).exec();
    if (!userView) return { userView: null, hasPaid: false };

    return { userView, hasPaid: userView.payment };
  }

  private calculateAverage(ratings: number[]) {
    if (ratings.length === 0) {
      return 0;
    }

    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return sum / ratings.length;
  }

  async getUserMedia(userId: string): Promise<MediaEntity[]> {
    const medias = await this.mediaModel
      .find({ owner: userId })
      .populate('owner')
      .populate('views')
      .exec();

    return medias.map((media) => ({
      id: media.id,
      code: media.code,
      price: media.price,
      currency: media.owner.currency,
      url: media.originalUrl,
      singleView: media.singleView,
      totalViews: media.views.length,
      mime: media.mime,
      earnings: media.price * media.views.length,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    }));
  }

  async getMedia(code: string, ip: string): Promise<MediaEntity> {
    const media = await this.mediaModel
      .findOne({ code })
      .populate('views')
      .populate('owner')
      .exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });

    const { userView, hasPaid } = await this.getUserView(media, ip);
    let mediaUrl: string;
    if (userView && hasPaid) {
      userView.lastSeen = new Date();
      await userView.save();
      mediaUrl = media.originalUrl;
    } else {
      mediaUrl = media.blurredUrl;
    }

    return {
      id: media.id,
      code: media.code,
      price: media.price,
      currency: media.owner.currency,
      url: mediaUrl,
      singleView: media.singleView,
      totalViews: media.views.length,
      mime: media.mime,
      viewer: {
        hasPaid,
        leftFeedback: userView ? userView.leftFeedback : false,
      },
      owner: {
        nickname: media.owner.nickname,
        ratings: this.calculateAverage(media.owner.ratings),
      },
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }

  async upload(
    file: Express.Multer.File,
    createMediaDto: CreateMediaDto,
    userId: string,
  ): Promise<Media> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });
    if (!user.stripeVerified)
      throw new BadRequestException({ error: 'User not verified' });

    const { price, singleView } = createMediaDto;
    const parsedPrice = parseInt(price);
    const parsedSingleView = singleView.toLowerCase() === 'true';
    if (parsedPrice < 500 || parsedPrice > 50000)
      throw new BadRequestException({ error: 'Invalid price' });

    const salt = await bcrypt.genSalt();
    const originalName = await bcrypt.hash(userId + 'original', salt);
    const blurredName = await bcrypt.hash(userId + 'blurred', salt);

    const originalUrl = await this.awsService.uploadFile(file, originalName);
    let blurredUrl: string;
    if (file.mimetype.includes('image')) {
      const blurredBuffer = await sharp(file.buffer).blur(15).toBuffer();
      const blurredFile = {
        originalname: blurredName,
        buffer: blurredBuffer,
        mimetype: file.mimetype,
        size: blurredBuffer.length,
      };
      blurredUrl = await this.awsService.uploadFile(blurredFile, blurredName);
    } else {
      blurredUrl = this.configService.get<string>('VIDEO_DEFAULT_BLURRED_URL');
    }

    try {
      const code = new Date().valueOf();
      const media = await this.mediaModel.create({
        code,
        price: parsedPrice,
        owner: user,
        mime: file.mimetype,
        size: file.size,
        originalName,
        blurredName,
        originalUrl,
        blurredUrl,
        singleView: parsedSingleView,
      });

      await this.mediaQueue.add(
        {
          mediaId: media.id,
          url: media.originalUrl,
          mime: media.mime,
          size: media.size,
        },
        { attempts: 3 },
      );

      return media;
    } catch (error: any) {
      this.logger.error(
        'An error occured when uploading a new media file',
        error,
      );
      throw new BadRequestException({ error: error.code });
    }
  }

  async deleteMedia(id: string, userId: string) {
    const media = await this.mediaModel
      .findById(id)
      .populate('owner')
      .populate('views')
      .exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });

    if (media.owner._id != userId)
      throw new UnauthorizedException({ error: 'Access denied' });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentView = media.views.some(
      (view: View) => new Date(view.lastSeen) > oneDayAgo,
    );
    if (recentView)
      throw new BadRequestException({
        error: 'Cannot delete media with recent views',
      });

    await this.awsService.deleteFile(media.originalName);
    if (media.mime.includes('image'))
      await this.awsService.deleteFile(media.blurredName);

    const viewIds = media.views.map((view) => view._id);
    await this.viewModel.deleteMany({ _id: { $in: viewIds } }).exec();
    await this.mediaModel.findByIdAndDelete(id).exec();
  }

  async leaveFeedback(feedbackDto: LeaveFeedbackDto, ip: string) {
    const media = await this.mediaModel
      .findOne({ code: feedbackDto.code })
      .populate('views')
      .exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });

    const { userView, hasPaid } = await this.getUserView(media, ip);
    if (!userView || !hasPaid)
      throw new UnauthorizedException({ error: 'Not a paid viewer' });

    if (userView.leftFeedback) {
      throw new BadRequestException({ error: 'Feedback already left' });
    } else {
      userView.leftFeedback = true;
      await userView.save();
      media.markModified('views');
      await media.save();

      const user = await this.userModel.findById(media.owner).exec();
      user.ratings.push(feedbackDto.rating);
      await user.save();
    }
  }
}
