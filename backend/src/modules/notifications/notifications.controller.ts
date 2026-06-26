import { Controller, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';

@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req, @Query('filter') filter?: string) {
    const clerkUserId = req.user.clerkUserId;
    return this.notificationsService.getUserNotifications(clerkUserId, filter);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    const clerkUserId = req.user.clerkUserId;
    return this.notificationsService.getUnreadCount(clerkUserId);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req) {
    const clerkUserId = req.user.clerkUserId;
    return this.notificationsService.markAllAsRead(clerkUserId);
  }

  @Patch(':id/read')
  async markAsRead(@Req() req, @Param('id') id: string) {
    const clerkUserId = req.user.clerkUserId;
    return this.notificationsService.markAsRead(clerkUserId, id);
  }
}
