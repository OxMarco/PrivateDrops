import { IsNumber, IsString, Max, Min } from 'class-validator';

export class LeaveFeedbackDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
}
