import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import sharp from 'sharp';
import { AwsService } from '../aws/aws.service';
import { View } from '../schemas/view';
import { User } from '../schemas/user';
import { Media } from '../schemas/media';
import { CreateMediaDto } from '../dtos/create-media';
import { MediaEntity } from '../entities/media';
import { LeaveFeedbackDto } from '../dtos/leave-feedback';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaService {
  constructor(
    private configService: ConfigService,
    private awsService: AwsService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    @InjectModel(View.name) private viewModel: Model<View>,
  ) {}

  private async getUserView(media: Media, ip: string) {
    const found = media.views.find((view) => view.ip === ip);
    if (!found) return null;

    const userView = await this.viewModel.findById((found as any)._id).exec();

    return userView;
  }

  async registerPayment(code: string, ip: string) {
    const media: any = await this.mediaModel
      .findOne({ code })
      .populate('owner')
      .exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });

    const hasValidView = media.views.some((view) => view['ip'] === ip);
    if (hasValidView) return;

    if (media.singleView && media.views.length)
      throw new BadRequestException({ error: 'Max views reached' });

    const view = await this.viewModel.create({
      ip,
      payment: true,
    });
    media.views.push(view);
    await media.save();

    const user = await this.userModel.findById(media.owner._id).exec();
    if (!user) throw new NotFoundException({ error: 'User not found' });

    user.payouts += media.price;
    await user.save();
  }

  async getUserMedia(userId: string): Promise<MediaEntity[]> {
    const medias = await this.mediaModel
      .find({ owner: userId })
      .populate('views')
      .exec();

    return medias.map((media) => ({
      id: media.id,
      code: media.code,
      price: media.price,
      currency: media.currency,
      url: media.originalUrl,
      singleView: media.singleView,
      totalViews: media.views.length,
      earnings: media.price * media.views.length,
    }));
  }

  async getMedia(code: string, ip: string): Promise<any> {
    const media = await this.mediaModel
      .findOne({ code })
      .populate('views')
      .populate('owner')
      .exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });

    const userView = await this.getUserView(media, ip);
    let mediaUrl: string;
    if (userView) {
      userView.lastSeen = new Date();
      await userView.save();
      mediaUrl = media.originalUrl;
    } else {
      mediaUrl = media.blurredUrl;
    }

    return {
      mediaUrl,
      price: media.price,
      currency: media.currency,
      singleView: media.singleView,
      mime: media.mime,
      nickname: (media.owner as any).nickname,
      paid: userView != null,
      ratings: this.calculateAverage((media.owner as any).ratings),
      leftFeedback: userView ? userView.leftFeedback : false,
    };
  }

  async upload(
    file: Express.Multer.File,
    createMediaDto: CreateMediaDto,
    userId: string,
  ): Promise<Media> {
    const { price, singleView } = createMediaDto;
    const parsedPrice = parseInt(price);
    const parsedSingleView = singleView.toLowerCase() === 'true';
    if (parsedPrice < 99 || parsedPrice > 50000)
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

    const user = await this.userModel.findById(userId).exec();
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

      return media;
    } catch (error: any) {
      throw new BadRequestException({ error: error.code });
    }
  }

  async deleteMedia(id: string, userId: string) {
    const media = await this.mediaModel.findById(id).populate('owner').exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });

    if ((media.owner as any)._id != userId)
      throw new UnauthorizedException({ error: 'Access denied' });

    await this.awsService.deleteFile(media.originalName);
    if (media.mime.includes('image'))
      await this.awsService.deleteFile(media.blurredName);

    const viewIds = media.views.map((view) => (view as any)._id);
    await this.viewModel.deleteMany({ _id: { $in: viewIds } }).exec();
    await this.mediaModel.findByIdAndDelete(id).exec();
  }

  async leaveFeedback(feedbackDto: LeaveFeedbackDto, ip: string) {
    const media = await this.mediaModel
      .findOne({ code: feedbackDto.code })
      .populate('views')
      .exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });

    const userView = await this.getUserView(media, ip);
    if (!userView) throw new UnauthorizedException({ error: 'View not found' });

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

  calculateAverage(ratings: number[]) {
    if (ratings.length === 0) {
      return 0;
    }

    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return (sum / ratings.length).toFixed(2);
  }
}
