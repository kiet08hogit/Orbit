import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PostType } from '@prisma/client';

export class CreatePostDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsEnum(PostType)
  @IsNotEmpty()
  postType: PostType;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isAnonymous?: boolean;
}
