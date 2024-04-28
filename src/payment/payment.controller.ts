import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Public } from 'src/decorators/public';
import { CheckoutDto } from 'src/dtos/checkout';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Get('/verify/:code')
  async verifyPayment(
    @Param('code') code: string,
    @Ip() ip: string,
  ): Promise<boolean> {
    return await this.paymentService.verifyPayment(code, ip);
  }

  @Get('/kyc')
  async getKycLink(@Req() req: Request): Promise<string> {
    const userId: string = (req as any).id;
    return await this.paymentService.getKycLink(userId);
  }

  @Public()
  @Post('/checkout')
  async getCheckoutLink(
    @Body() checkoutDto: CheckoutDto,
    @Ip() ip: string,
  ): Promise<string> {
    return await this.paymentService.getCheckoutLink(
      checkoutDto.code,
      checkoutDto.redirectUrlSuccess,
      checkoutDto.redirectUrlCancel,
      ip,
    );
  }

  @Public()
  @Post('/webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return await this.paymentService.webhook(req.rawBody, signature);
  }
}
