import { Controller, Get, Patch, UseGuards, Param, Body, NotFoundException, ConflictException, Query, Post, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
        if (!user) {
            throw new NotFoundException("User not found");
        }
        return user;
    }

    @Get(':id/followers')
    @UseGuards(ClerkAuthGuard)
    async getFollowers(@Param('id') id: string) {
        return this.usersService.getFollowers(id);
    }

    @Get(':id/following')
    @UseGuards(ClerkAuthGuard)
    async getFollowing(@Param('id') id: string) {
        return this.usersService.getFollowing(id);
    }

    @Post(':id/follow')
    @UseGuards(ClerkAuthGuard)
    async toggleFollow(@Param('id') id: string, @CurrentUser() clerkUser: AuthUser) {
        const result = await this.usersService.toggleFollow(id, clerkUser.clerkUserId);
        if (!result) throw new NotFoundException("User not found or cannot follow yourself");
        return result;
    }

    @Delete(':id/follower')
    @UseGuards(ClerkAuthGuard)
    async removeFollower(@Param('id') id: string, @CurrentUser() clerkUser: AuthUser) {
        const result = await this.usersService.removeFollower(id, clerkUser.clerkUserId);
        if (!result) throw new NotFoundException("Follower not found");
        return result;
    }

    @Post('verify-edu/send')
    @UseGuards(ClerkAuthGuard)
    async sendEduVerification(@CurrentUser() clerkUser: AuthUser) {
        return this.usersService.sendEduVerification(clerkUser.clerkUserId);
    }

    @Post('verify-edu/verify')
    @UseGuards(ClerkAuthGuard)
    async verifyEduCode(@CurrentUser() clerkUser: AuthUser, @Body('code') code: string) {
        return this.usersService.verifyEduCode(clerkUser.clerkUserId, code);
    }
}
