import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway
  ) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    content?: string;
    linkUrl?: string;
    actorId?: string;
    postId?: string;
    listingId?: string;
  }) {
    // Don't notify yourself
    if (data.userId === data.actorId) return null;

    const notification = await this.prisma.notification.create({
      data,
      include: {
        actor: {
          select: { name: true, username: true, avatarUrl: true }
        }
      }
    });

    // We can emit this notification directly through the chat gateway
    // Assuming user joined a room with their userId
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (user) {
      this.chatGateway.server.to(user.clerkUserId).emit('new_notification', notification);
    }

    return notification;
  }

  async getUserNotifications(clerkUserId: string, filter?: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) throw new NotFoundException('User not found');

    const whereClause: any = { userId: user.id };
    
    if (filter && filter !== 'ALL') {
      whereClause.type = filter as NotificationType;
    }

    return this.prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: { select: { name: true, username: true, avatarUrl: true } }
      }
    });
  }

  async getUnreadCount(clerkUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) return { unreadCount: 0 };

    const count = await this.prisma.notification.count({
      where: { userId: user.id, isRead: false }
    });
    return { unreadCount: count };
  }

  async markAsRead(clerkUserId: string, notificationId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) throw new NotFoundException('User not found');

    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.userId !== user.id) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  async markAllAsRead(clerkUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    });

    return { success: true };
  }
}
