import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferStatus, ListingStatus } from '@prisma/client';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class OffersService {
    constructor(
        private prisma: PrismaService,
        private chatService: ChatService,
    ) { }

    async createOffer(clerkUserId: string, createOfferDto: CreateOfferDto) {
        // Find user
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId }
        });
        if (!dbUser) throw new NotFoundException('User not found');

        // Find listing
        const listing = await this.prisma.listing.findUnique({
            where: { id: createOfferDto.listingId }
        });
        if (!listing) throw new NotFoundException('Listing not found');

        if (listing.status !== ListingStatus.ACTIVE) {
            throw new BadRequestException('Listing is no longer active');
        }

        if (listing.sellerId === dbUser.id) {
            throw new BadRequestException('Cannot make an offer on your own listing');
        }

        if (createOfferDto.price > listing.price) {
            throw new BadRequestException('Offer cannot be higher than listing price');
        }

        // Check if there is already a pending offer from this user
        const existingOffer = await this.prisma.offer.findFirst({
            where: {
                buyerId: dbUser.id,
                listingId: listing.id,
                status: OfferStatus.PENDING,
            }
        });

        if (existingOffer) {
            throw new BadRequestException('You already have a pending offer for this listing');
        }

        // Create the offer
        const offer = await this.prisma.offer.create({
            data: {
                price: createOfferDto.price,
                listingId: listing.id,
                buyerId: dbUser.id,
                status: OfferStatus.PENDING,
            },
            include: {
                listing: { select: { title: true, sellerId: true } }
            }
        });

        // Chat integration: Find or create conversation and send system message
        try {
            // Find existing conversation between buyer and seller for this listing
            let conversation = await this.prisma.conversation.findFirst({
                where: {
                    listingId: listing.id,
                    members: {
                        every: {
                            userId: { in: [dbUser.id, listing.sellerId] }
                        }
                    }
                }
            });

            if (!conversation) {
                conversation = await this.prisma.conversation.create({
                    data: {
                        listingId: listing.id,
                        members: {
                            create: [
                                { userId: dbUser.id },
                                { userId: listing.sellerId }
                            ]
                        }
                    }
                });
            }

            // Send a system message in the chat
            await this.chatService.createMessage(
                clerkUserId,
                conversation.id,
                `I have made an offer of $${offer.price} for this item.`
            );
        } catch (error) {
            console.error('Failed to send offer chat message:', error);
        }

        return offer;
    }

    async getOffersSent(clerkUserId: string) {
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId }
        });
        if (!dbUser) throw new NotFoundException('User not found');

        return this.prisma.offer.findMany({
            where: { buyerId: dbUser.id },
            include: {
                listing: {
                    include: { images: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getOffersReceived(clerkUserId: string) {
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId }
        });
        if (!dbUser) throw new NotFoundException('User not found');

        return this.prisma.offer.findMany({
            where: {
                listing: { sellerId: dbUser.id }
            },
            include: {
                listing: {
                    include: { images: true }
                },
                buyer: {
                    select: { id: true, name: true, username: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async acceptOffer(clerkUserId: string, offerId: string) {
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId }
        });
        if (!dbUser) throw new NotFoundException('User not found');

        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: { listing: true }
        });

        if (!offer) throw new NotFoundException('Offer not found');

        if (offer.listing.sellerId !== dbUser.id) {
            throw new ForbiddenException('You do not have permission to accept this offer');
        }

        if (offer.status !== OfferStatus.PENDING) {
            throw new BadRequestException('Offer is no longer pending');
        }

        // Use transaction to accept this offer and reject all other pending offers for this listing
        await this.prisma.$transaction(async (prisma) => {
            // Accept the target offer
            await prisma.offer.update({
                where: { id: offerId },
                data: { status: OfferStatus.ACCEPTED }
            });

            // Reject all other pending offers for the same listing
            await prisma.offer.updateMany({
                where: {
                    listingId: offer.listingId,
                    status: OfferStatus.PENDING,
                    id: { not: offerId }
                },
                data: { status: OfferStatus.REJECTED }
            });
        });

        return { success: true, message: 'Offer accepted successfully' };
    }

    async rejectOffer(clerkUserId: string, offerId: string) {
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId }
        });
        if (!dbUser) throw new NotFoundException('User not found');

        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: { listing: true }
        });

        if (!offer) throw new NotFoundException('Offer not found');

        if (offer.listing.sellerId !== dbUser.id) {
            throw new ForbiddenException('You do not have permission to reject this offer');
        }

        if (offer.status !== OfferStatus.PENDING) {
            throw new BadRequestException('Offer is no longer pending');
        }

        const updatedOffer = await this.prisma.offer.update({
            where: { id: offerId },
            data: { status: OfferStatus.REJECTED }
        });

        return updatedOffer;
    }

    async cancelOffer(clerkUserId: string, offerId: string) {
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId }
        });
        if (!dbUser) throw new NotFoundException('User not found');

        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId }
        });

        if (!offer) throw new NotFoundException('Offer not found');

        if (offer.buyerId !== dbUser.id) {
            throw new ForbiddenException('You do not have permission to cancel this offer');
        }

        if (offer.status !== OfferStatus.PENDING) {
            throw new BadRequestException('Only pending offers can be cancelled');
        }

        const updatedOffer = await this.prisma.offer.update({
            where: { id: offerId },
            data: { status: OfferStatus.CANCELLED }
        });

        return updatedOffer;
    }
}
