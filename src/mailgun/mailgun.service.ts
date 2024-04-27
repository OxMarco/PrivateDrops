import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class MailgunService {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async sendEmail(
    to: string,
    subject: string,
    textEmail: string,
    htmlEmail: string,
  ): Promise<void> {
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY');
    const domain = this.configService.get<string>('MAILGUN_DOMAIN');
    const from = `PrivateDrops <mailgun@privatedrops.me>`;

    const url = `https://api.mailgun.net/v3/${domain}/messages`;
    const formData = new URLSearchParams();
    formData.append('from', from);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', textEmail);
    formData.append('html', htmlEmail);

    const auth = `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`;

    try {
      await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: {
            Authorization: auth,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
    } catch (error) {
      throw new BadRequestException({ error: 'Failed to send email' });
    }
  }

  loadHtmlTemplate(data: any, filename: string): string {
    const filePath = path.join(__dirname, './templates/' + filename + '.html');
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const template = handlebars.compile(htmlContent);
    return template(data);
  }
}
