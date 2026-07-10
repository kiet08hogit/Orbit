import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateOfferDto {
    @IsString()
    @IsNotEmpty()
    listingId: string;

    @IsNumber()
    @Min(1)
    price: number;
}
