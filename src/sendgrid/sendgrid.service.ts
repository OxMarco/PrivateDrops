import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDataRequired, default as SendGrid } from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

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
    htmlEmail: string,
  ): Promise<void> {
    try {
      const mail: MailDataRequired = {
        to,
        from: 'PrivateDrops <info@privatedrops.me>',
        subject,
        content: [{ type: 'text/plain', value: textEmail }],
      };
      await SendGrid.send(mail);
    } catch (error) {
      throw new BadRequestException({ error });
    }
  }

  loadHtmlTemplate(data: any, filename: string): string {
    const filePath = path.join(__dirname, './templates/' + filename + '.html');
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const template = handlebars.compile(htmlContent);
    return template(data);
  }
}
