import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateListingDto } from './create-listing.dto';
import { ListingStatus, InteractionType } from '@prisma/client';
@Injectable()
export class ListingsService {
    constructor(private prisma: PrismaService) { }

    async create(clerkUserId: string, data: CreateListingDto) {
        const dbuser = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!dbuser) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.listing.create({
            data: {
                title: data.title,
                description: data.description,
                price: data.price,
                category: data.category,
                status: ListingStatus.ACTIVE,
                sellerId: dbuser.id,
            },
        });
    }

    async findLatestListings(limit: number = 20) {
        return this.prisma.listing.findMany({
            where: { status: ListingStatus.ACTIVE },
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

    async getUserListings(userId: string) {
        return this.prisma.listing.findMany({
            where: { sellerId: userId },
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
