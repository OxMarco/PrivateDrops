import { IsEthereumAddress } from 'class-validator';

export class CryptoPayoutDto {
  @IsEthereumAddress()
  address: string;
}
