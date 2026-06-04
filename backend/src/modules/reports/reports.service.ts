import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) {}

    async createReport(reporterClerkUserId: string, body: { listingId?: string, reportedUserId?: string, reason: string }) {
        const reporter = await this.prisma.user.findUnique({ where: { clerkUserId: reporterClerkUserId } });
        if (!reporter) throw new NotFoundException('Reporter not found');

        let reportedUserDbId = undefined;

        // If a listing is reported, we can also extract the seller
        if (body.listingId) {
            const listing = await this.prisma.listing.findUnique({ where: { id: body.listingId }});
            if (listing) {
                reportedUserDbId = listing.sellerId;
            }
        }

        // If a user is directly reported (e.g. from chat)
        if (body.reportedUserId) {
             const reportedUser = await this.prisma.user.findUnique({ where: { clerkUserId: body.reportedUserId } });
             if (reportedUser) {
                 reportedUserDbId = reportedUser.id;
             }
        }

        return this.prisma.report.create({
            data: {
                reporterId: reporter.id,
                reportedUserId: reportedUserDbId,
                listingId: body.listingId,
                reason: body.reason,
            }
        });
    }
}
