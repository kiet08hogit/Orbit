import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateListingDto } from './create-listing.dto';
import { ListingStatus, InteractionType, ListingCategory } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
@Injectable()
export class ListingsService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService
    ) { }

    async create(clerkUserId: string, email: string, data: CreateListingDto, file?: any) {
        let dbuser = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!dbuser) {
            dbuser = await this.prisma.user.create({
                data: { clerkUserId, email }
            });
        }

        const listing = await this.prisma.listing.create({
            data: {
                title: data.title,
                description: data.description,
                price: data.price,
                category: data.category,
                status: ListingStatus.ACTIVE,
                sellerId: dbuser.id,
            },
        });

        if (file) {
            const imageUrl = await this.storageService.saveFile(file);
            await this.prisma.listingImage.create({
                data: {
                    url: imageUrl,
                    listingId: listing.id
                }
            });
        }

        return listing;
    }

    async findLatestListings(category?: ListingCategory, limit: number = 20) {
        return this.prisma.listing.findMany({
            where: { 
                status: ListingStatus.ACTIVE,
                ...(category ? { category } : {})
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                images: true,
                seller: { select: { id: true, email: true } },
            },
        });
    }

    async findById(id: string) {
        return this.prisma.listing.findUnique({
            where: { id },
            include: {
                images: true,
                seller: true,
            },
        });
    }

    async getUserListings(clerkUserId: string) {
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId: clerkUserId },
        });
        if (!dbUser) throw new NotFoundException('User not found');
        return this.prisma.listing.findMany({
            where: { sellerId: dbUser.id },
            orderBy: { createdAt: 'desc' },
            include: { images: true },
        });
    }

    async getSwipeFeed(clerkUserId: string, limit: number = 10) {
        // 1. Get the actual user
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId },
        });

        if (!dbUser) throw new NotFoundException('User not found');

        // 2. Fetch the feed
        return this.prisma.listing.findMany({
            where: {
                status: 'ACTIVE', // Only show active items
                sellerId: { not: dbUser.id }, // RULE 1: Not my own stuff
                interactions: {
                    none: { userId: dbUser.id } // RULE 2: No previous interactions
                }
            },
            take: limit, // Only fetch a batch at a time (e.g. 10 cards)
            // Include the seller's profile info so the frontend can show who is selling it!
            include: {
                seller: {
                    select: { id: true, name: true, username: true, avatarUrl: true }
                }
            }
        });
    }

    async recordSwipe(clerkUserId: string, listingId: string, type: InteractionType) {
        const dbUser = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!dbUser) throw new NotFoundException('User not found');

        // UPSERT: If they already swiped, change their swipe. If not, create a new one!
        return this.prisma.interaction.upsert({
            where: {
                userId_listingId: { // This uses the @@unique constraint from our schema!
                    userId: dbUser.id,
                    listingId: listingId,
                }
            },
            update: { type },
            create: {
                userId: dbUser.id,
                listingId: listingId,
                type: type
            }
        });
    }

}

