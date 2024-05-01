import { Logger } from '@nestjs/common';
import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';

type FileJob = {
  mediaId: string;
  url: string;
  mime: string;
};

@Processor('file')
export class FileProcessor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger(FileProcessor.name);
  }

  @Process()
  async send(job: Job<FileJob>) {
    const data = job.data;

    // TODO check if media is copyrighted or child abuse, if so remove it and send mail warning to user
  }

  @OnQueueError()
  onError(job: Job) {
    this.logger.error('An error occurred in the file checker queue', job.data);
  }
}
