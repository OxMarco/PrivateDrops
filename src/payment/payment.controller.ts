import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { Public } from 'src/decorators/public';
import { CheckoutDto } from 'src/dtos/checkout';
import { LowercasePipe } from 'src/validation/lowercase';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Get('/verify/:code')
  async verifyPayment(
    @Param('code', LowercasePipe) code: string,
    @Headers('x-forwarded-for') ip: string,
  ): Promise<boolean> {
    return await this.paymentService.verifyPayment(code, ip);
  }

  @Public()
  @Post('/checkout')
  async getCheckoutLink(
    @Body() checkoutDto: CheckoutDto,
    @Headers('x-forwarded-for') ip: string,
  ): Promise<string> {
    return await this.paymentService.getCheckoutLink(
      checkoutDto.code,
      checkoutDto.redirectUrlSuccess,
      checkoutDto.redirectUrlCancel,
      ip,
    );
  }

  @Get('/kyc')
  async getKycLink(@Req() req: Request): Promise<string> {
    const userId: string = req.id;
    return await this.paymentService.getKycLink(userId);
  }

  @Get('/payouts')
  async getPayoutsInfo(@Req() req: Request): Promise<any> {
    const userId: string = req.id;
    return await this.paymentService.getPayoutsInfo(userId);
  }

  @Post('/payout')
  async requestPayout(@Req() req: Request): Promise<string> {
    const userId: string = req.id;
    return await this.paymentService.requestPayout(userId);
  }
}
