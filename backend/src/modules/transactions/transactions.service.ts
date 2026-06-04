import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service'
import { ChatGateway } from '../chat/chat.gateway'
import * as crypto from 'crypto'

@Injectable()
export class TransactionsService {
    constructor(
        private prisma: PrismaService,
        private chatGateway: ChatGateway,
    ) {}

    // Generate a secure 6-digit code
    private generateMeetupCode(): string {
        return crypto.randomInt(100000, 999999).toString();
    }

    async startMeetup(sellerClerkUserId: string, listingId: string, buyerId: string) {
        // Find seller user
        const seller = await this.prisma.user.findUnique({
            where: { clerkUserId: sellerClerkUserId }
        });
        if (!seller) throw new NotFoundException('Seller not found');

        // Check if listing belongs to seller
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId }
        });
        if (!listing) throw new NotFoundException('Listing not found');
        if (listing.sellerId !== seller.id) {
            throw new ForbiddenException('You do not own this listing');
        }

        // Find buyer user
        const buyer = await this.prisma.user.findUnique({
            where: { id: buyerId }
        });
        if (!buyer) throw new NotFoundException('Buyer not found');

        // Find or create transaction
        let transaction = await this.prisma.transaction.findFirst({
            where: {
                listingId,
                buyerId,
                sellerId: seller.id
            }
        });

        if (!transaction) {
            transaction = await this.prisma.transaction.create({
                data: {
                    listingId,
                    buyerId,
                    sellerId: seller.id,
                }
            });
        }

        // Check cooldown
        if (transaction.meetupLastSentAt) {
            const timeSinceLastSent = Date.now() - transaction.meetupLastSentAt.getTime();
            if (timeSinceLastSent < 60000) { // 60 seconds cooldown
                throw new BadRequestException('Please wait before requesting a new code.');
            }
        }

        // Generate code
        const code = this.generateMeetupCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Save code to database
        transaction = await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                status: 'MEETING_STARTED',
                meetupCode: code, // Plain text for MVP as requested, to allow buyer fallback fetch
                meetupCodeExpiresAt: expiresAt,
                meetupVerifyAttempts: 0,
                meetupLastSentAt: new Date(),
            }
        });

        // Emit WebSocket to Buyer only
        this.chatGateway.sendMeetupCode(buyer.clerkUserId, {
            transactionId: transaction.id,
            listingId: transaction.listingId,
            code,
            expiresAt,
            message: "Seller requested meetup verification. Only share this code when you are physically meeting the seller."
        });

        return { message: "Verification code sent to the buyer in the app." };
    }

    async getActiveMeetupCode(buyerClerkUserId: string, listingId: string, sellerId: string) {
        const buyer = await this.prisma.user.findUnique({
            where: { clerkUserId: buyerClerkUserId }
        });
        if (!buyer) throw new NotFoundException('Buyer not found');

        const transaction = await this.prisma.transaction.findFirst({
            where: {
                listingId,
                buyerId: buyer.id,
                sellerId,
                status: 'MEETING_STARTED',
            }
        });

        if (!transaction) {
            return { activeCode: null, message: "No active meetup code." };
        }

        // Check if expired
        if (transaction.meetupCodeExpiresAt && transaction.meetupCodeExpiresAt.getTime() < Date.now()) {
            return { activeCode: null, message: "Code has expired." };
        }

        return {
            activeCode: {
                transactionId: transaction.id,
                code: transaction.meetupCode,
                expiresAt: transaction.meetupCodeExpiresAt
            }
        };
    }

    async verifyMeetupCode(sellerClerkUserId: string, listingId: string, buyerId: string, code: string) {
        if (!code || code.length !== 6) {
            throw new BadRequestException('Code must be exactly 6 digits.');
        }

        const seller = await this.prisma.user.findUnique({
            where: { clerkUserId: sellerClerkUserId }
        });
        if (!seller) throw new NotFoundException('Seller not found');

        const transaction = await this.prisma.transaction.findFirst({
            where: { 
                listingId,
                buyerId,
                sellerId: seller.id
            },
            include: { buyer: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        
        if (transaction.status === 'MEETUP_CONFIRMED') {
            throw new BadRequestException('Meetup already confirmed.');
        }

        if (transaction.meetupVerifyAttempts >= 5) {
            throw new BadRequestException('Too many failed attempts. Please request a new code.');
        }

        if (!transaction.meetupCodeExpiresAt || transaction.meetupCodeExpiresAt.getTime() < Date.now()) {
            throw new BadRequestException('Code has expired. Please request a new code.');
        }

        if (transaction.meetupCode !== code) {
            await this.prisma.transaction.update({
                where: { id: transaction.id },
                data: { meetupVerifyAttempts: transaction.meetupVerifyAttempts + 1 }
            });
            throw new BadRequestException('Invalid code.');
        }

        // Success!
        const updated = await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                status: 'MEETUP_CONFIRMED',
                meetupVerifiedAt: new Date(),
                meetupCode: null, // Clear the code after use
                meetupCodeExpiresAt: null
            }
        });

        // Notify both parties
        this.chatGateway.sendMeetupConfirmed(transaction.buyer.clerkUserId, seller.clerkUserId, {
            transactionId: updated.id,
            status: updated.status,
            meetupVerifiedAt: updated.meetupVerifiedAt
        });

        return { message: "Meetup confirmed successfully." };
    }
}
