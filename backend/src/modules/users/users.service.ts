import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

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

        let defaultUniversity = null;
        if (email.endsWith('@uic.edu')) defaultUniversity = 'University of Illinois Chicago';
        else if (email.endsWith('@illinois.edu')) defaultUniversity = 'University of Illinois Urbana-Champaign';
        else if (email.endsWith('@depaul.edu')) defaultUniversity = 'DePaul University';
        else if (email.endsWith('.edu')) defaultUniversity = email.split('@')[1];

        if (!user) {
            user = await this.prisma.user.create({
                data: { clerkUserId, email, university: defaultUniversity },
            });
        } else {
            let updateData: any = {};
            if (user.clerkUserId !== clerkUserId) {
                updateData.clerkUserId = clerkUserId;
            }
            if (!user.university && defaultUniversity) {
                updateData.university = defaultUniversity;
            }
            
            if (Object.keys(updateData).length > 0) {
                user = await this.prisma.user.update({
                    where: { email },
                    data: updateData,
                });
            }
        }

        return user;
    }
    async getUserById(id: string, currentUserId?: string) {
        const user = await this.prisma.user.findFirst({ 
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
                    select: { followers: true, following: true }
                }
            }
        });

        if (!user) return null;

        let isFollowing = false;
        if (currentUserId) {
            const follower = await this.prisma.user.findFirst({
                where: { OR: [{ id: currentUserId }, { clerkUserId: currentUserId }] },
                select: { id: true }
            });
            if (follower) {
                const link = await this.prisma.user.findFirst({
                    where: { id: user.id, followers: { some: { id: follower.id } } }
                });
                isFollowing = !!link;
            }
        }

        return { ...user, isFollowing };
    }

    async toggleFollow(targetId: string, currentUserId: string) {
        const targetUser = await this.prisma.user.findFirst({ where: { OR: [{ id: targetId }, { clerkUserId: targetId }] } });
        const currentUser = await this.prisma.user.findFirst({ where: { OR: [{ id: currentUserId }, { clerkUserId: currentUserId }] } });
        
        if (!targetUser || !currentUser || targetUser.id === currentUser.id) return null;
        
        const isFollowing = await this.prisma.user.findFirst({
            where: { id: targetUser.id, followers: { some: { id: currentUser.id } } }
        });
        
        if (isFollowing) {
            await this.prisma.user.update({
                where: { id: currentUser.id },
                data: { following: { disconnect: { id: targetUser.id } } }
            });
            return { following: false };
        } else {
            await this.prisma.user.update({
                where: { id: currentUser.id },
                data: { following: { connect: { id: targetUser.id } } }
            });

            // Trigger notification
            await this.notificationsService.createNotification({
                userId: targetUser.id,
                type: 'FOLLOW',
                title: 'New Follower',
                content: `${currentUser.name || currentUser.username || 'Someone'} started following you!`,
                linkUrl: `/profile/${currentUser.clerkUserId}`,
                actorId: currentUser.id,
            });

            return { following: true };
        }
    }

    async searchUsers(query: string) {
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 20,
            select: { id: true, clerkUserId: true, name: true, username: true, avatarUrl: true, major: true, _count: { select: { followers: true } } }
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
