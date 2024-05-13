import {
  IsAlphanumeric,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class LeaveFeedbackDto {
  @IsAlphanumeric()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}
