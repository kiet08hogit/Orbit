import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // This function finds a user, or creates one if they don't exist yet!
    async syncUser(clerkUserId: string, email: string) {
        let user = await this.prisma.user.findFirst({
            where: { 
                OR: [
                    { clerkUserId },
                    { email }
                ]
            },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: { clerkUserId, email },
            });
        } else if (user.clerkUserId !== clerkUserId) {
            // If the user deleted and recreated their account in Clerk, update their new clerkUserId
            user = await this.prisma.user.update({
                where: { email },
                data: { clerkUserId },
            });
        }

        return user;
    }
    async getUserById(id: string) {
        return this.prisma.user.findFirst({ 
            where: { 
                OR: [
                    { id: id },
                    { clerkUserId: id }
                ]
            },
            include: {
                listings: {
                    where: { status: 'ACTIVE' },
                    include: { images: true }
                },
                _count: {
                    select: { listings: true }
                }
            }
        });
    }

    async updateUser(clerkUserId: string, updateData: any) {
        return this.prisma.user.update({
            where: { clerkUserId },
            data: updateData,
        });
    }

    async deleteUserByClerkId(clerkUserId: string) {
        return this.prisma.user.delete({
            where: { clerkUserId },
        });
    }
}
