import { Controller, Headers, Post, RawBodyRequest, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { WebhookService } from './webhook.service';
import { Public } from 'src/decorators/public';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @Post()
  @SkipThrottle()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    console.log('request rawBody', req.rawBody);
    return await this.webhookService.handleWebhook(
      req.rawBody,
      signature,
      false,
    );
  }

  @Public()
  @Post('/connect')
  @SkipThrottle()
  async handleConnectWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    console.log('request rawBody', req.rawBody);
    return await this.webhookService.handleWebhook(
      req.rawBody,
      signature,
      true,
    );
  }
}
