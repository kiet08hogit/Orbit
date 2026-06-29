import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  revieweeId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
