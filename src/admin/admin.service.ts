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

@Injectable()
export class AdminService {
  constructor(
    private awsService: AwsService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    @InjectModel(View.name) private viewModel: Model<View>,
  ) {}

  private async checkIfAdmin(id: string) {
    return true;
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

  async getAllViews(id: string): Promise<View[]> {
    await this.checkIfAdmin(id);

    return await this.viewModel.find().exec();
  }

  async mediaCleanup(mediaId: string, userId: string) {
    await this.checkIfAdmin(userId);

    const media = await this.mediaModel.findById(mediaId).exec();
    if (!media) throw new NotFoundException();

    await this.awsService.deleteFile(media.originalName);
    if (media.mime.includes('image'))
      await this.awsService.deleteFile(media.blurredName);

    const viewIds = media.views.map((view: ViewDocument) => view._id);
    await this.viewModel.deleteMany({ _id: { $in: viewIds } }).exec();
    await this.mediaModel.findByIdAndDelete(mediaId).exec();
  }
}
