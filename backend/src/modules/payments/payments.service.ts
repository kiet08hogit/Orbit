import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Stripe v22 CJS types aren't easily importable — use require + any for the instance
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');

@Injectable()
export class PaymentsService {
    private stripe: any;

    constructor(private prisma: PrismaService) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
            apiVersion: '2026-05-27.dahlia',
        });
    }

    async createStripeConnectAccount(clerkUserId: string) {
        const user = await this.prisma.user.findUnique({
            where: { clerkUserId },
        });

        if (!user) throw new NotFoundException('User not found');

        let accountId = user.stripeAccountId;

        if (!accountId) {
            const account = await this.stripe.accounts.create({
                type: 'express',
                email: user.email,
                capabilities: {
                    transfers: { requested: true },
                },
            });

            accountId = account.id;

            await this.prisma.user.update({
                where: { id: user.id },
                data: { stripeAccountId: accountId },
            });
        }

        const accountLink = await this.stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/profile/${clerkUserId}?stripe_refresh=true`,
            return_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/profile/${clerkUserId}?stripe_return=true`,
            type: 'account_onboarding',
        });

        return { url: accountLink.url };
    }

    async verifyStripeConnect(clerkUserId: string) {
        const user = await this.prisma.user.findUnique({
            where: { clerkUserId },
        });

        if (!user || !user.stripeAccountId) {
            return { linked: false };
        }

        const account = await this.stripe.accounts.retrieve(user.stripeAccountId);

        if (account.details_submitted && account.payouts_enabled) {
            if (!user.stripeAccountLinked) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { stripeAccountLinked: true },
                });
            }
            return { linked: true };
        }

        return { linked: false };
    }

    async createPaymentIntent(buyerClerkUserId: string, listingId: string) {
        const buyer = await this.prisma.user.findUnique({ where: { clerkUserId: buyerClerkUserId } });
        if (!buyer) throw new NotFoundException('Buyer not found');

        const listing = await this.prisma.listing.findUnique({ 
            where: { id: listingId },
            include: { seller: true }
        });

        if (!listing) throw new NotFoundException('Listing not found');
        if (listing.sellerId === buyer.id) throw new BadRequestException('Cannot buy your own listing');
        if (listing.status !== 'ACTIVE') throw new BadRequestException(`Listing is not active (Status: ${listing.status})`);
        
        if (!listing.acceptsProtectedPayment) {
            throw new BadRequestException('This listing does not accept protected payments');
        }

        if (!listing.seller.stripeAccountLinked || !listing.seller.stripeAccountId) {
            throw new BadRequestException('Seller has not connected their bank account yet');
        }

        const amountCents = Math.round(listing.price * 100);

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: amountCents,
            currency: 'usd',
            capture_method: 'manual',
            transfer_data: {
                destination: listing.seller.stripeAccountId,
            },
            metadata: {
                listingId: listing.id,
                buyerId: buyer.id,
                sellerId: listing.sellerId,
            }
        });

        await this.prisma.listing.update({
            where: { id: listing.id },
            data: { status: 'PENDING_PAYMENT' }
        });

        await this.prisma.transaction.create({
            data: {
                listingId: listing.id,
                buyerId: buyer.id,
                sellerId: listing.sellerId,
                paymentMethod: 'STRIPE',
                paymentStatus: 'UNPAID',
                orderStatus: 'PENDING_PAYMENT',
                stripePaymentIntentId: paymentIntent.id,
                amount: amountCents,
            }
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        };
    }

    async capturePaymentAndPayout(transactionId: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        if (transaction.paymentStatus !== 'PAID_HELD') {
            throw new BadRequestException('Payment is not currently held');
        }
        if (!transaction.stripePaymentIntentId) {
            throw new BadRequestException('No Stripe PaymentIntent associated');
        }

        try {
            const captured = await this.stripe.paymentIntents.capture(transaction.stripePaymentIntentId);

            await this.prisma.$transaction([
                this.prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        paymentStatus: 'RELEASED_TO_SELLER',
                        orderStatus: 'COMPLETED'
                    }
                }),
                this.prisma.listing.update({
                    where: { id: transaction.listingId },
                    data: { status: 'SOLD' }
                })
            ]);

            return { success: true, paymentIntent: captured };
        } catch (error: any) {
            throw new InternalServerErrorException(`Failed to capture payment: ${error.message}`);
        }
    }

    async handleWebhook(signature: string, body: Buffer) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        
        let event: any;

        if (webhookSecret) {
            try {
                event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
            } catch (err: any) {
                throw new BadRequestException(`Webhook Error: ${err.message}`);
            }
        } else {
            const payload = JSON.parse(body.toString());
            event = payload as any;
        }

        if (event.type === 'payment_intent.amount_capturable_updated') {
            const paymentIntent = event.data.object as any;
            
            const transaction = await this.prisma.transaction.findUnique({
                where: { stripePaymentIntentId: paymentIntent.id }
            });

            if (transaction) {
                await this.prisma.$transaction([
                    this.prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            paymentStatus: 'PAID_HELD',
                            orderStatus: 'PAID_PENDING_MEETUP'
                        }
                    }),
                    this.prisma.listing.update({
                        where: { id: transaction.listingId },
                        data: { status: 'RESERVED' }
                    })
                ]);
            }
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object as any;
            const transaction = await this.prisma.transaction.findUnique({
                where: { stripePaymentIntentId: paymentIntent.id }
            });

            if (transaction) {
                await this.prisma.$transaction([
                    this.prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            paymentStatus: 'UNPAID',
                            orderStatus: 'CANCELLED'
                        }
                    }),
                    this.prisma.listing.update({
                        where: { id: transaction.listingId },
                        data: { status: 'ACTIVE' }
                    })
                ]);
            }
        }

        return { received: true };
    }
}
