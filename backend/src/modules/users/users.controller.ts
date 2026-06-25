import { Controller, Get, Patch, UseGuards, Param, Body, NotFoundException, ConflictException, UseInterceptors, Query, Post } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser} from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.type';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @UseGuards(ClerkAuthGuard)
    async getMe(@CurrentUser() clerkUser: AuthUser) {
        const dbUser = await this.usersService.syncUser(
            clerkUser.clerkUserId,
            clerkUser.email,
        );
        return dbUser;
    }

    @Patch('me')
    @UseGuards(ClerkAuthGuard)
    async updateProfile(@CurrentUser() clerkUser: AuthUser, @Body() updateData: any) {
        try {
            return await this.usersService.updateUser(clerkUser.clerkUserId, updateData);
        } catch (error: any) {
            // Prisma error code for Unique Constraint Violation
            if (error.code === 'P2002') {
                throw new ConflictException('Username is already taken.');
            }
            throw error;
        }
    }

    @Get('search')
    @UseGuards(ClerkAuthGuard)
    async searchUsers(@Query('q') query: string) {
        if (!query) return [];
        return this.usersService.searchUsers(query);
    }

    @Get(':id')
    @UseGuards(ClerkAuthGuard)
    async getUser(@Param('id') id: string, @CurrentUser() clerkUser: AuthUser) {
        const user = await this.usersService.getUserById(id, clerkUser?.clerkUserId);
        if (!user){
            throw new NotFoundException("User not found");
        }
        return user;
    }

    @Post(':id/follow')
    @UseGuards(ClerkAuthGuard)
    async toggleFollow(@Param('id') id: string, @CurrentUser() clerkUser: AuthUser) {
        const result = await this.usersService.toggleFollow(id, clerkUser.clerkUserId);
        if (!result) throw new NotFoundException("User not found or cannot follow yourself");
        return result;
    }


}
