import { Controller,Body,UseGuards, Post, Get, Param, Query, NotFoundException, UseInterceptors, UploadedFiles, Delete, Put } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ListingsService } from './listings.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {CreateListingDto} from './create-listing.dto';
import { AuthUser } from '../../common/types/auth-user.type';
import { InteractionType, ListingCategory } from '@prisma/client';

@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService){}

    @Post()
    @UseGuards(ClerkAuthGuard)
    @UseInterceptors(FilesInterceptor('images', 6))
    async createListing(@CurrentUser() clerkUser: AuthUser, @Body() createListingDto: CreateListingDto, @UploadedFiles() files: any[])
     {
        console.log("Create listing request body:", createListingDto);
        console.log("Uploaded files:", files?.length);
        return this.listingsService.create(clerkUser.clerkUserId, clerkUser.email, createListingDto, files);
    }

    @Get()
    @UseGuards(ClerkAuthGuard)
    async getFeed(@CurrentUser() clerkUser: AuthUser) {
        return this.listingsService.getSwipeFeed(clerkUser.clerkUserId);
    }

    @Get('all')
    @UseGuards(ClerkAuthGuard)
    @UseInterceptors(CacheInterceptor)
    async getAllListings(
        @Query('category') category?: ListingCategory,
        @Query('q') q?: string
    ) {
        return this.listingsService.findLatestListings(category, q);
    }

    @Get('recommendations')
    @UseGuards(ClerkAuthGuard)
    @UseInterceptors(CacheInterceptor)
    async getRecommendations(
        @Query('q') q: string,
        @Query('category') category?: ListingCategory,
    ) {
        if (!q) return [];
        return this.listingsService.findSmartListings(q, category);
    }

    @Get('hot')
    @UseGuards(ClerkAuthGuard)
    @UseInterceptors(CacheInterceptor)
    async getHotFeed() {
        return this.listingsService.getHotListings(10);
    }

    @Get('viewed')
    @UseGuards(ClerkAuthGuard)
    async getViewedFeed(@CurrentUser() clerkUser: AuthUser) {
        return this.listingsService.getViewedListings(clerkUser.clerkUserId, 10);
    }

    @Get('recommended')
    @UseGuards(ClerkAuthGuard)
    async getRecommendedFeed(@CurrentUser() clerkUser: AuthUser) {
        return this.listingsService.getRecommendedListings(clerkUser.clerkUserId);
    }

    @Post('backfill')
    async backfill() {
        return this.listingsService.backfillEmbeddings();
    }

    @Post(':id/view')
    @UseGuards(ClerkAuthGuard)
    async recordView(@CurrentUser() clerkUser: AuthUser, @Param('id') id: string) {
        return this.listingsService.recordView(clerkUser.clerkUserId, id);
    }

    @Post(':id/swipe')
    @UseGuards(ClerkAuthGuard)
    async swipe(@CurrentUser() clerkUser: AuthUser, @Param('id') id: string, @Body() body: { type: InteractionType }) {
        return this.listingsService.recordSwipe(clerkUser.clerkUserId, id, body.type);
    }

    @Get('my-listings')
    @UseGuards(ClerkAuthGuard)
    async getMyListings(@CurrentUser() clerkUser: AuthUser) {
        return this.listingsService.getUserListings(clerkUser.clerkUserId);
    }

    @Get('wishlist')
    @UseGuards(ClerkAuthGuard)
    async getWishlist(@CurrentUser() clerkUser: AuthUser) {
        return this.listingsService.getWishlist(clerkUser.clerkUserId);
    }

    @Get('wishlist-count')
    @UseGuards(ClerkAuthGuard)
    async getWishlistCount(@CurrentUser() clerkUser: AuthUser) {
        return this.listingsService.getWishlistCount(clerkUser.clerkUserId);
    }

    @Get(':id')
    @UseGuards(ClerkAuthGuard)
    @UseInterceptors(CacheInterceptor)
    async getListing(@Param('id') id: string) {
        const listing = await this.listingsService.findById(id);
        if (!listing) {
            throw new NotFoundException('Listing not found');
        }
        return listing;
    }
    @Delete(':id')
    @UseGuards(ClerkAuthGuard)
    async deleteListing(@CurrentUser() clerkUser: AuthUser, @Param('id') id: string) {
        return this.listingsService.deleteListing(clerkUser.clerkUserId, id);
    }
    @Put(':id')
    @UseGuards(ClerkAuthGuard)
    async updateListing(@CurrentUser() clerkUser: AuthUser, @Param('id') id: string, @Body() updateListingDto: CreateListingDto) {
        return this.listingsService.updateListing(clerkUser.clerkUserId, id, updateListingDto);
    }
}

