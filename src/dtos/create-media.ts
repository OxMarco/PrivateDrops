import { IsString } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  price: string;

  @IsString()
  singleView: string;
}
