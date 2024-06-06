import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { Job } from 'bull';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Media } from 'src/schemas/media';
import { SentryLogger } from 'src/sentry-logger';
import { MediaFileJob } from './media.t';

@Processor('media')
export class MediaProcessor {
  private logger: SentryLogger;

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    @InjectModel(Media.name) private mediaModel: Model<Media>,
  ) {
    this.logger = new SentryLogger(MediaProcessor.name);
  }

  @Process()
  async send(job: Job<MediaFileJob>) {
    const data = job.data;

    if (!data.mime.includes('image')) return;
    const { data: response } = await firstValueFrom(
      this.httpService
        .get('https://api.sightengine.com/1.0/check.json', {
          params: {
            url: data.url,
            models: 'face-attributes',
            api_user: this.configService.get<string>('SIGHTENGINE_USER'),
            api_secret: this.configService.get<string>(
              'SIGHTENGINE_SECRET_KEY',
            ),
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw 'Error occurred when processing media';
          }),
        ),
    );
    if (this.checkForMinor(response)) {
      this.logger.error(
        'This media may contain underage people',
        job.data.mediaId,
      );

      const media = await this.mediaModel
        .findById(data.mediaId)
        .populate('owner')
        .exec();
      if (!media) {
        this.logger.error('Media not found', job.data.mediaId);
        return;
      }

      media.flagged = true;
      await media.save();
    } else {
      this.logger.log('This media does not contain underage people');
    }
  }

  @OnQueueError()
  onError(job: Job) {
    this.logger.error('An error occurred in the media checker queue', job.data);
  }

  private checkForMinor(response: any) {
    if (response.faces && response.faces.length > 0) {
      for (const face of response.faces) {
        if (face.attributes && face.attributes.minor >= 0.7) {
          return true;
        }
      }
    }
    return false;
  }
}
