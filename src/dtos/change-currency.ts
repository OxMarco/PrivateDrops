import { IsISO4217CurrencyCode, IsNotEmpty } from 'class-validator';

export class ChangeCurrencyDto {
  @IsISO4217CurrencyCode()
  @IsNotEmpty()
  currency: string;
}
