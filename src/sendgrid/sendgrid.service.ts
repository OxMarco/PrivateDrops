import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, default as SendGrid } from '@sendgrid/mail';
import { HtmlEmailFields, getHtmlTemplate } from './template.mail';

@Injectable()
export class SendgridService {
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    SendGrid.setApiKey(apiKey);
  }

  async sendEmail(
    to: string,
    subject: string,
    textEmail: string,
    htmlEmailOptions: HtmlEmailFields,
  ): Promise<void> {
    const htmlEmail = getHtmlTemplate(htmlEmailOptions);

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
      throw new BadRequestException({ error });
    }
  }
}
