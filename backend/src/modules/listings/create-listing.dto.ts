import { IsString, IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { ListingCategory } from '@prisma/client';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  price: number;

  @IsEnum(ListingCategory)
  category: ListingCategory;
}
