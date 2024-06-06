import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, default as SendGrid } from '@sendgrid/mail';
import { SentryLogger } from 'src/sentry-logger';

@Injectable()
export class SendgridService {
  private logger: SentryLogger;

  constructor(private configService: ConfigService) {
    this.logger = new SentryLogger(SendgridService.name);
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    SendGrid.setApiKey(apiKey);
  }

  async sendEmail(
    to: string,
    subject: string,
    textEmail: string,
    htmlEmail: string,
  ): Promise<void> {
    try {
      const mail: MailDataRequired = {
        to,
        from: 'PrivateDrops <info@privatedrops.me>',
        subject,
        content: [
          { type: 'text/plain', value: textEmail },
          { type: 'text/html', value: htmlEmail },
        ],
      };
      await SendGrid.send(mail);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}`, error);
      throw new BadRequestException({ error });
    }
  }
}
