import { Logger } from '@nestjs/common';
import { Processor, Process, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import { SendgridService } from './sendgrid.service';

type MailJob = {
  email: string;
  subject: string;
  textMail: string;
  htmlMail: string;
};

@Processor('mail')
export class MailProcessor {
  private logger: Logger;

  constructor(private sendgridService: SendgridService) {
    this.logger = new Logger(MailProcessor.name);
  }

  @Process()
  async send(job: Job<MailJob>) {
    const data = job.data;

    await this.sendgridService.sendEmail(
      data.email,
      data.subject,
      data.textMail,
      data.htmlMail,
    );
  }

  @OnQueueError()
  onError(job: Job) {
    this.logger.error('An error occurred in the mailer queue', job.data);
  }
}
