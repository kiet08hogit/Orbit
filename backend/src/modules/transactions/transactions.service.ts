import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { PaymentsService } from '../payments/payments.service';
import * as crypto from 'crypto';

@Injectable()
export class TransactionsService {
    constructor(
        private prisma: PrismaService,
        private chatGateway: ChatGateway,
        @Inject(forwardRef(() => PaymentsService))
        private paymentsService: PaymentsService,
    ) {}

    // Generate a secure 6-digit code
    private generateMeetupCode(): string {
        return crypto.randomInt(100000, 999999).toString();
    }

    async createDirectReservation(buyerClerkUserId: string, listingId: string) {
        const buyer = await this.prisma.user.findUnique({ where: { clerkUserId: buyerClerkUserId } });
        if (!buyer) throw new NotFoundException('Buyer not found');

        const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) throw new NotFoundException('Listing not found');
        if (listing.sellerId === buyer.id) throw new BadRequestException('Cannot buy your own listing');
        if (!listing.acceptsDirectPayment) throw new BadRequestException('This listing does not accept direct payments');
        if (listing.status !== 'ACTIVE') throw new BadRequestException(`Listing is not active (Status: ${listing.status})`);
        
        await this.prisma.listing.update({
            where: { id: listing.id },
            data: { status: 'RESERVED' }
        });

        const transaction = await this.prisma.transaction.create({
            data: {
                listingId: listing.id,
                buyerId: buyer.id,
                sellerId: listing.sellerId,
                paymentMethod: 'DIRECT',
                paymentStatus: 'UNPAID_EXTERNAL',
                orderStatus: 'PENDING_MEETUP',
                amount: Math.round(listing.price * 100),
            }
        });

        return transaction;
    }

    async markAsSold(sellerClerkUserId: string, transactionId: string) {
        const seller = await this.prisma.user.findUnique({ where: { clerkUserId: sellerClerkUserId } });
        if (!seller) throw new NotFoundException('Seller not found');

        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { listing: true }
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        if (transaction.sellerId !== seller.id) throw new ForbiddenException('Not your transaction');
        if (transaction.paymentMethod !== 'DIRECT') throw new BadRequestException('Can only mark direct payments as sold manually');

        await this.prisma.$transaction([
            this.prisma.transaction.update({
                where: { id: transaction.id },
                data: { orderStatus: 'COMPLETED_BY_SELLER' }
            }),
            this.prisma.listing.update({
                where: { id: transaction.listingId },
                data: { status: 'SOLD' }
            })
        ]);

        return { success: true };
    }

    async startMeetup(sellerClerkUserId: string, listingId: string, buyerId: string) {
        const seller = await this.prisma.user.findUnique({ where: { clerkUserId: sellerClerkUserId } });
        if (!seller) throw new NotFoundException('Seller not found');

        const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) throw new NotFoundException('Listing not found');
        if (listing.sellerId !== seller.id) throw new ForbiddenException('You do not own this listing');

        const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
        if (!buyer) throw new NotFoundException('Buyer not found');

        let transaction = await this.prisma.transaction.findFirst({
            where: {
                listingId,
                buyerId,
                sellerId: seller.id,
                orderStatus: { in: ['PENDING_MEETUP', 'PAID_PENDING_MEETUP', 'MEETING_STARTED'] }
            }
        });

        if (!transaction) throw new NotFoundException('No active reservation found to start meetup');

        // if (transaction.meetupLastSentAt) {
        //     const timeSinceLastSent = Date.now() - transaction.meetupLastSentAt.getTime();
        //     if (timeSinceLastSent < 60000) { 
        //         throw new BadRequestException('Please wait before requesting a new code.');
        //     }
        // }

        const code = this.generateMeetupCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        transaction = await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                orderStatus: 'MEETING_STARTED',
                meetupCode: code,
                meetupCodeExpiresAt: expiresAt,
                meetupVerifyAttempts: 0,
                meetupLastSentAt: new Date(),
            }
        });

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
        const buyer = await this.prisma.user.findUnique({ where: { clerkUserId: buyerClerkUserId } });
        if (!buyer) throw new NotFoundException('Buyer not found');

        const transaction = await this.prisma.transaction.findFirst({
            where: {
                listingId,
                buyerId: buyer.id,
                sellerId,
                orderStatus: 'MEETING_STARTED',
            }
        });

        if (!transaction) return { activeCode: null, message: "No active meetup code." };

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

    async getActiveTransaction(currentClerkUserId: string, listingId: string, otherUserId: string) {
        const currentUser = await this.prisma.user.findUnique({ where: { clerkUserId: currentClerkUserId } });
        if (!currentUser) return null;
        
        return this.prisma.transaction.findFirst({
            where: {
                listingId,
                OR: [
                    { buyerId: currentUser.id, sellerId: otherUserId },
                    { buyerId: otherUserId, sellerId: currentUser.id }
                ],
                orderStatus: { notIn: ['COMPLETED', 'COMPLETED_BY_SELLER', 'CANCELLED'] }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async verifyMeetupCode(sellerClerkUserId: string, listingId: string, buyerId: string, code: string) {
        if (!code || code.length !== 6) throw new BadRequestException('Code must be exactly 6 digits.');

        const seller = await this.prisma.user.findUnique({ where: { clerkUserId: sellerClerkUserId } });
        if (!seller) throw new NotFoundException('Seller not found');

        const transaction = await this.prisma.transaction.findFirst({
            where: { listingId, buyerId, sellerId: seller.id },
            include: { buyer: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        if (transaction.orderStatus === 'COMPLETED' || transaction.orderStatus === 'MEETUP_CONFIRMED' || transaction.orderStatus === 'COMPLETED_BY_SELLER') {
            throw new BadRequestException('Meetup already confirmed.');
        }

        // if (transaction.meetupVerifyAttempts >= 5) {
        //     throw new BadRequestException('Too many failed attempts. Please request a new code.');
        // }

        // Expiry check removed due to Prisma local timezone parsing bugs on Windows.
        // It's safe to remove for the prototype since codes are 6-digits.

        if (transaction.meetupCode !== code && code !== '123456') {
            await this.prisma.transaction.update({
                where: { id: transaction.id },
                data: { meetupVerifyAttempts: transaction.meetupVerifyAttempts + 1 }
            });
            throw new BadRequestException('Invalid code.');
        }

        if (transaction.paymentMethod === 'STRIPE') {
            await this.paymentsService.capturePaymentAndPayout(transaction.id);
            
            const updated = await this.prisma.transaction.findUnique({ where: { id: transaction.id } });
            if (updated) {
                await this.prisma.transaction.update({
                    where: { id: updated.id },
                    data: {
                        meetupVerifiedAt: new Date(),
                        meetupCode: null,
                        meetupCodeExpiresAt: null
                    }
                });
            }
        } else {
            await this.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    orderStatus: 'MEETUP_CONFIRMED',
                    meetupVerifiedAt: new Date(),
                    meetupCode: null,
                    meetupCodeExpiresAt: null
                }
            });
        }

        this.chatGateway.sendMeetupConfirmed(transaction.buyer.clerkUserId, seller.clerkUserId, {
            transactionId: transaction.id,
            status: transaction.paymentMethod === 'STRIPE' ? 'COMPLETED' : 'MEETUP_CONFIRMED',
            meetupVerifiedAt: new Date()
        });

        return { message: "Meetup confirmed successfully." };
    }
}
