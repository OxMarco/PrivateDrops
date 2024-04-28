import { IsNotEmpty, IsAlphanumeric, IsString } from 'class-validator';

export class CheckoutDto {
  @IsAlphanumeric()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  redirectUrlSuccess: string;

  @IsString()
  @IsNotEmpty()
  redirectUrlCancel: string;
}
