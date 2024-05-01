import { Logger } from '@nestjs/common';
import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { HttpService } from '@nestjs/axios';
import { Job } from 'bull';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

type FileJob = {
  mediaId: string;
  url: string;
  mime: string;
};

@Processor('file')
export class FileProcessor {
  private logger: Logger;

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.logger = new Logger(FileProcessor.name);
  }

  @Process()
  async send(job: Job<FileJob>) {
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
      this.logger.log('This media contains underage people');
    }

    // TODO check if media is copyrighted or child abuse, if so remove it and send mail warning to user
  }

  @OnQueueError()
  onError(job: Job) {
    this.logger.error('An error occurred in the file checker queue', job.data);
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
