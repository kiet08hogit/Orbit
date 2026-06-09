import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.type';

@Controller('transactions')
@UseGuards(ClerkAuthGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) {}

    @Post('direct-reservation')
    async createDirectReservation(
        @CurrentUser() clerkUser: AuthUser,
        @Body() body: { listingId: string }
    ) {
        return this.transactionsService.createDirectReservation(clerkUser.clerkUserId, body.listingId);
    }

    @Post(':id/mark-as-sold')
    async markAsSold(
        @CurrentUser() clerkUser: AuthUser,
        @Param('id') transactionId: string
    ) {
        return this.transactionsService.markAsSold(clerkUser.clerkUserId, transactionId);
    }

    @Post('start-meetup')
    async startMeetup(
        @CurrentUser() clerkUser: AuthUser,
        @Body() body: { listingId: string, buyerId: string }
    ) {
        return this.transactionsService.startMeetup(clerkUser.clerkUserId, body.listingId, body.buyerId);
    }

    @Get('active-meetup-code')
    async getActiveMeetupCode(
        @CurrentUser() clerkUser: AuthUser,
        @Query('listingId') listingId: string,
        @Query('sellerId') sellerId: string
    ) {
        return this.transactionsService.getActiveMeetupCode(clerkUser.clerkUserId, listingId, sellerId);
    }

    @Get('active')
    async getActiveTransaction(
        @CurrentUser() clerkUser: AuthUser,
        @Query('listingId') listingId: string,
        @Query('otherUserId') otherUserId: string
    ) {
        return this.transactionsService.getActiveTransaction(clerkUser.clerkUserId, listingId, otherUserId);
    }

    @Post('verify-meetup-code')
    async verifyMeetupCode(
        @CurrentUser() clerkUser: AuthUser,
        @Body() body: { listingId: string, buyerId: string, code: string }
    ) {
        return this.transactionsService.verifyMeetupCode(clerkUser.clerkUserId, body.listingId, body.buyerId, body.code);
    }
}
