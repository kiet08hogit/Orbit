import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthUser {
    clerkUserId: string;
}

@Controller('reports')
@UseGuards(ClerkAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Post()
    async createReport(
        @CurrentUser() clerkUser: AuthUser,
        @Body() body: { listingId?: string, reportedUserId?: string, reason: string }
    ) {
        return this.reportsService.createReport(clerkUser.clerkUserId, body);
    }
}
