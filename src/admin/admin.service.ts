import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AwsService } from 'src/aws/aws.service';
import { Media } from 'src/schemas/media';
import { User } from 'src/schemas/user';
import { View, ViewDocument } from 'src/schemas/view';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class AdminService {
  constructor(
    private awsService: AwsService,
    private stripeService: StripeService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    @InjectModel(View.name) private viewModel: Model<View>,
  ) {}

  private async checkIfAdmin(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user || user.nickname != 'admin')
      throw new UnauthorizedException({ error: 'Not an admin' });
  }

  async getAllUsers(id: string): Promise<User[]> {
    await this.checkIfAdmin(id);

    return await this.userModel.find().exec();
  }

  async getAllMedia(id: string): Promise<Media[]> {
    await this.checkIfAdmin(id);

    return await this.mediaModel
      .find()
      .populate('views')
      .populate('owner')
      .exec();
  }

  async getFlaggedMedia(id: string): Promise<Media[]> {
    await this.checkIfAdmin(id);

    return await this.mediaModel
      .find({ flagged: true })
      .populate('views')
      .populate('owner')
      .exec();
  }

  async getAllViews(id: string): Promise<View[]> {
    await this.checkIfAdmin(id);

    return await this.viewModel.find().exec();
  }

  async mediaCleanup(mediaId: string, userId: string) {
    await this.checkIfAdmin(userId);

    const media = await this.mediaModel.findById(mediaId).exec();
    if (!media) throw new NotFoundException({ error: 'Media not found' });

    await this.awsService.deleteFile(media.originalName);
    if (media.mime.includes('image'))
      await this.awsService.deleteFile(media.blurredName);

    const viewIds = media.views.map((view: ViewDocument) => view._id);
    await this.viewModel.deleteMany({ _id: { $in: viewIds } }).exec();
    await this.mediaModel.findByIdAndDelete(mediaId).exec();
  }
}
