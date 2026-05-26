import { Controller, Get, Patch, UseGuards, Param, Body, NotFoundException, ConflictException, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser} from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @UseGuards(ClerkAuthGuard)
    async getMe(@CurrentUser() clerkUser: any) {
        const dbUser = await this.usersService.syncUser(
            clerkUser.clerkUserId,
            clerkUser.email,
        );
        return dbUser;
    }

    @Patch('me')
    @UseGuards(ClerkAuthGuard)
    async updateProfile(@CurrentUser() clerkUser: any, @Body() updateData: any) {
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

    @Get(':id')
    @UseGuards(ClerkAuthGuard)
    @UseInterceptors(CacheInterceptor)
    async getUser(@Param('id') id: string) {

        const user = await this.usersService.getUserById(id);
        if (!user){
            throw new NotFoundException("User not found");
        }
        return user;
    }


}
