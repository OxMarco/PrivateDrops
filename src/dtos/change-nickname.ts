import { IsNotEmpty, IsAlphanumeric } from 'class-validator';

export class ChangeNicknameDto {
  @IsAlphanumeric()
  @IsNotEmpty()
  nickname: string;
}
