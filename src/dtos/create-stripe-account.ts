import { IsISO31661Alpha2, IsNotEmpty } from 'class-validator';

export class CreateStripeAccountDto {
  @IsISO31661Alpha2()
  @IsNotEmpty()
  country: string;
}
