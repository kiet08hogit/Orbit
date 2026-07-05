import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { createClerkClient } from '@clerk/backend';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  private clerkClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  }

  async getStats() {
    const totalUsers = await this.prisma.user.count();
    const totalListings = await this.prisma.listing.count();
    const pendingReports = await this.prisma.report.count({
      where: { status: 'PENDING' },
    });
    const totalTransactions = await this.prisma.transaction.count();

    return {
      totalUsers,
      totalListings,
      pendingReports,
      totalTransactions,
    };
  }

  async getReports() {
    return this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
        reportedUser: {
          select: { id: true, name: true, email: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async updateReportStatus(id: string, status: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    const updatedReport = await this.prisma.report.update({
      where: { id },
      data: { status },
    });

    if (status === 'RESOLVED' && updatedReport.reportedUserId) {
      const resolvedCount = await this.prisma.report.count({
        where: {
          reportedUserId: updatedReport.reportedUserId,
          status: 'RESOLVED',
        },
      });

      if (resolvedCount >= 4) {
        // Automatically ban the user
        await this.toggleBanUser(updatedReport.reportedUserId, true);
        
        // Notify them of the ban
        await this.notificationsService.createNotification({
          userId: updatedReport.reportedUserId,
          type: 'WARNING',
          title: 'Account Banned',
          content: `You have been reported ${resolvedCount} times and your account has been automatically banned.`,
        });
      } else {
        // Send a warning notification about the resolved report
        await this.notificationsService.createNotification({
          userId: updatedReport.reportedUserId,
          type: 'WARNING',
          title: 'Policy Violation Warning',
          content: `You have received a resolved report. You currently have ${resolvedCount} resolved report(s). If you reach 4 reports, your account will be banned.`,
        });
      }
    }

    return updatedReport;
  }

  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        university: true,
        isBanned: true,
        role: true,
        createdAt: true,
        _count: {
          select: { reportsReceived: true },
        },
      },
    });
  }

  async toggleBanUser(id: string, isBanned: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Sync ban status with Clerk to actually prevent logins and revoke sessions
    try {
      if (isBanned) {
        await this.clerkClient.users.banUser(user.clerkUserId);
      } else {
        await this.clerkClient.users.unbanUser(user.clerkUserId);
      }
    } catch (error) {
      console.error(`Failed to update ban status in Clerk for user ${user.clerkUserId}:`, error);
      // Optional: You could throw an error here if you want to prevent DB update when Clerk fails
    }

    return this.prisma.user.update({
      where: { id },
      data: { isBanned },
      select: { id: true, email: true, isBanned: true },
    });
  }

  async warnUser(userId: string, title: string, message: string) {
    return this.notificationsService.createNotification({
      userId,
      type: 'WARNING',
      title: title || 'Admin Warning',
      content: message,
    });
  }
}
