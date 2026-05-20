import { Controller,Body,UseGuards, Post } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {CreateListingDto} from './create-listing.dto';

@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService){}

    @Post()
    @UseGuards(ClerkAuthGuard)
    async createListing(@CurrentUser() clerkUser: any, @Body() createListingDto: CreateListingDto) {
        return this.listingsService.create(clerkUser.clerkUserId, createListingDto);
    }
}
