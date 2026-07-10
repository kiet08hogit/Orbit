import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('offers')
@UseGuards(ClerkAuthGuard)
export class OffersController {
    constructor(private readonly offersService: OffersService) { }

    @Post()
    createOffer(
        @CurrentUser() user: any,
        @Body() createOfferDto: CreateOfferDto
    ) {
        return this.offersService.createOffer(user.clerkUserId, createOfferDto);
    }

    @Get('me/sent')
    getOffersSent(@CurrentUser() user: any) {
        return this.offersService.getOffersSent(user.clerkUserId);
    }

    @Get('me/received')
    getOffersReceived(@CurrentUser() user: any) {
        return this.offersService.getOffersReceived(user.clerkUserId);
    }

    @Patch(':id/accept')
    acceptOffer(
        @CurrentUser() user: any,
        @Param('id') id: string
    ) {
        return this.offersService.acceptOffer(user.clerkUserId, id);
    }

    @Patch(':id/reject')
    rejectOffer(
        @CurrentUser() user: any,
        @Param('id') id: string
    ) {
        return this.offersService.rejectOffer(user.clerkUserId, id);
    }

    @Delete(':id')
    cancelOffer(
        @CurrentUser() user: any,
        @Param('id') id: string
    ) {
        return this.offersService.cancelOffer(user.clerkUserId, id);
    }
}
