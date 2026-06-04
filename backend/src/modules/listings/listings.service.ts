import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateListingDto } from './create-listing.dto';
import { ListingStatus, InteractionType, ListingCategory } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class ListingsService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
        private aiService: AiService,
        private chatGateway: ChatGateway
    ) { }

    async create(clerkUserId: string, email: string, data: CreateListingDto, files?: any[]) {
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

        // Generate and save AI embedding
        try {
            const textToEmbed = `${data.title}. ${data.description}`;
            const embedding = await this.aiService.generateEmbedding(textToEmbed);
            const embeddingString = `[${embedding.join(',')}]`;
            await this.prisma.$executeRaw`UPDATE "Listing" SET embedding = ${embeddingString}::vector WHERE id = ${listing.id}`;
        } catch (error) {
            console.error("Failed to save AI embedding for listing", error);
        }

        if (files && files.length > 0) {
            for (const file of files) {
                const imageUrl = await this.storageService.saveFile(file);
                await this.prisma.listingImage.create({
                    data: {
                        url: imageUrl,
                        listingId: listing.id
                    }
                });
            }
        }

        return listing;
    }

    async findLatestListings(category?: ListingCategory, search?: string, limit: number = 20) {
        return this.prisma.listing.findMany({
            where: { 
                status: ListingStatus.ACTIVE,
                ...(category ? { category } : {}),
                ...(search ? {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } }
                    ]
                } : {})
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
                images: true,
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
        const interaction = await this.prisma.interaction.upsert({
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

        // Emit real-time update to the user's connected WebSocket clients
        this.chatGateway.server.to(clerkUserId).emit('update_wishlist_count');

        return interaction;
    }
    
    async getWishlistCount(clerkUserId: string) {
        const dbUser = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!dbUser) throw new NotFoundException('User not found');

        const count = await this.prisma.interaction.count({
            where: {
                userId: dbUser.id,
                type: 'LIKE',
                listing: {
                    status: 'ACTIVE'
                }
            }
        });

        return { count };
    }
    
    async getWishlist(clerkUserId: string) {
        const dbUser = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!dbUser) throw new NotFoundException('User not found');

        return this.prisma.listing.findMany({
            where: {
                status: 'ACTIVE',
                interactions: {
                    some: {
                        userId: dbUser.id,
                        type: 'LIKE'
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                images: true,
                seller: {
                    select: { id: true, name: true, username: true, avatarUrl: true }
                }
            }
        });
    }

    async deleteListing(clerkUserId: string, listingId: string) {
        const dbUser = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!dbUser) throw new NotFoundException('User not found');

        const images = await this.prisma.listingImage.findMany({
            where: { listingId },
            select: { url: true }
        });
        const deletePromises = images.map(img => this.storageService.deleteFile(img.url));
        await Promise.all(deletePromises);
        await this.prisma.listingImage.deleteMany({ where: { listingId } });

        return this.prisma.listing.delete({ where: { id: listingId, sellerId: dbUser.id } });
    }
    async updateListing(clerkUserId: string, listingId: string, data: Partial<CreateListingDto> & { status?: ListingStatus }) {
        const dbUser = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!dbUser) throw new NotFoundException('User not found');

        const updated = await this.prisma.listing.update({
            where: { id: listingId, sellerId: dbUser.id },
            data: {
                title: data.title,
                description: data.description,
                price: data.price,
                category: data.category,
                status: data.status,
            },
        });

        if (data.title || data.description) {
            try {
                const textToEmbed = `${updated.title}. ${updated.description}`;
                const embedding = await this.aiService.generateEmbedding(textToEmbed);
                const embeddingString = `[${embedding.join(',')}]`;
                await this.prisma.$executeRaw`UPDATE "Listing" SET embedding = ${embeddingString}::vector WHERE id = ${updated.id}`;
            } catch (error) {
                console.error("Failed to update AI embedding for listing", error);
            }
        }

        return updated;
    }

    // async findSmartListings(search: string, category?: ListingCategory, limit: number = 20) {
    //     try {
    //         const queryEmbedding = await this.aiService.generateEmbedding(search);
    //         const embeddingString = `[${queryEmbedding.join(',')}]`;
            
    //         // Query postgres for the closest vectors using Cosine Similarity (<=>)
    //         let results: { id: string }[];
            
    //         if (category) {
    //             results = await this.prisma.$queryRaw<{id: string}[]>`
    //                 SELECT id FROM "Listing" 
    //                 WHERE status = 'ACTIVE' AND category = ${category}::"ListingCategory"
    //                 ORDER BY embedding <=> ${embeddingString}::vector 
    //                 LIMIT ${limit};
    //             `;
    //         } else {
    //             results = await this.prisma.$queryRaw<{id: string}[]>`
    //                 SELECT id FROM "Listing" 
    //                 WHERE status = 'ACTIVE'
    //                 ORDER BY embedding <=> ${embeddingString}::vector 
    //                 LIMIT ${limit};
    //             `;
    //         }

    //         const ids = results.map(r => r.id);
    //         if (ids.length === 0) return [];

    //         const listings = await this.prisma.listing.findMany({
    //             where: { id: { in: ids } },
    //             include: {
    //                 images: true,
    //                 seller: { select: { id: true, email: true } },
    //             },
    //         });

    //         // Re-order the results to match the semantic closeness returned by Postgres
    //         return ids.map(id => listings.find(l => l.id === id)).filter(Boolean);
    //     } catch (error) {
    //         console.error("Smart search failed, falling back to basic keyword search", error);
    //         return this.findLatestListings(category, search, limit);
    //     }
    // }
}

