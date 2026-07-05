import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminGuard extends ClerkAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First run the base ClerkAuthGuard to ensure token is valid and set request.user
    const isAuth = await super.canActivate(context);
    if (!isAuth) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const clerkUserId = request.user?.clerkUserId;

    if (!clerkUserId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check database role
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
