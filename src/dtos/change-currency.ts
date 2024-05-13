import { IsISO4217CurrencyCode } from 'class-validator';

export class ChangeCurrencyDto {
  @IsISO4217CurrencyCode()
  currency: string;
}
