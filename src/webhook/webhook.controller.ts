import { Controller, Headers, Post, RawBodyRequest, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Public } from 'src/decorators/public';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return await this.webhookService.handleWebhook(req.rawBody, signature);
  }
}
