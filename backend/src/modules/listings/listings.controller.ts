import { Controller,Body,UseGuards, Post, Get, Param, Query, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ListingsService } from './listings.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {CreateListingDto} from './create-listing.dto';
import { InteractionType, ListingCategory } from '@prisma/client';

@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService){}

    @Post()
    @UseGuards(ClerkAuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    async createListing(@CurrentUser() clerkUser: any, @Body() createListingDto: CreateListingDto,@UploadedFile() file: any)
     {
        console.log("Create listing request body:", createListingDto);
        console.log("Uploaded file:", file);
        return this.listingsService.create(clerkUser.clerkUserId, clerkUser.email, createListingDto, file);
    }

    @Get()
    @UseGuards(ClerkAuthGuard)
    async getFeed(@CurrentUser() clerkUser: any) {
        return this.listingsService.getSwipeFeed(clerkUser.clerkUserId);
    }

    @Get('all')
    @UseGuards(ClerkAuthGuard)
    async getAllListings(@Query('category') category?: ListingCategory) {
        return this.listingsService.findLatestListings(category);
    }

    @Post(':id/swipe')
    @UseGuards(ClerkAuthGuard)
    async swipe(@CurrentUser() clerkUser: any, @Param('id') id: string, @Body() body: { type: InteractionType }) {
        return this.listingsService.recordSwipe(clerkUser.clerkUserId, id, body.type);
    }

    @Get('my-listings')
    @UseGuards(ClerkAuthGuard)
    async getMyListings(@CurrentUser() clerkUser: any) {
        return this.listingsService.getUserListings(clerkUser.clerkUserId);
    }

    @Get(':id')
    @UseGuards(ClerkAuthGuard)
    async getListing(@Param('id') id: string) {
        const listing = await this.listingsService.findById(id);
        if (!listing) {
            throw new NotFoundException('Listing not found');
        }
        return listing;
    }
}
