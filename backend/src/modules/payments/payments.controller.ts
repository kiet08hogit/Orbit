import { Controller, Post, Get, Body, Req, Headers, UseGuards, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @UseGuards(ClerkAuthGuard)
    @Post('connect')
    async createConnectAccount(@CurrentUser() user: any) {
        return this.paymentsService.createStripeConnectAccount(user.clerkUserId);
    }

    @UseGuards(ClerkAuthGuard)
    @Get('connect/status')
    async getConnectStatus(@CurrentUser() user: any) {
        return this.paymentsService.verifyStripeConnect(user.clerkUserId);
    }

    @UseGuards(ClerkAuthGuard)
    @Post('intent')
    async createPaymentIntent(
        @CurrentUser() user: any,
        @Body('listingId') listingId: string
    ) {
        return this.paymentsService.createPaymentIntent(user.clerkUserId, listingId);
    }

    @Post('webhook')
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string
    ) {
        if (!req.rawBody) {
            throw new Error('Raw body is missing');
        }
        return this.paymentsService.handleWebhook(signature, req.rawBody);
    }
}
