import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('reports')
  getReports() {
    return this.adminService.getReports();
  }

  @Patch('reports/:id')
  updateReportStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateReportStatus(id, status);
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/ban')
  toggleBanUser(@Param('id') id: string, @Body('isBanned') isBanned: boolean) {
    return this.adminService.toggleBanUser(id, isBanned);
  }

  @Patch('users/:id/warn')
  warnUser(@Param('id') id: string, @Body('title') title: string, @Body('message') message: string) {
    return this.adminService.warnUser(id, title, message);
  }
}
