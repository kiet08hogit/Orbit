import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Resend } from 'resend';

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
        let hasChatted = false;
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

                const chat = await this.prisma.conversation.findFirst({
                    where: {
                        AND: [
                            { members: { some: { userId: follower.id } } },
                            { members: { some: { userId: user.id } } }
                        ]
                    }
                });
                hasChatted = !!chat;
            }
        }

        return { ...user, isFollowing, hasChatted };
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

    async getFollowers(id: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [{ id }, { clerkUserId: id }]
            },
            include: {
                followers: {
                    select: { id: true, clerkUserId: true, name: true, username: true, avatarUrl: true, isEduVerified: true }
                }
            }
        });
        if (!user) throw new NotFoundException('User not found');
        return user.followers;
    }

    async getFollowing(id: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [{ id }, { clerkUserId: id }]
            },
            include: {
                following: {
                    select: { id: true, clerkUserId: true, name: true, username: true, avatarUrl: true, isEduVerified: true }
                }
            }
        });
        if (!user) throw new NotFoundException('User not found');
        return user.following;
    }

    async removeFollower(followerId: string, currentUserId: string) {
        const currentUser = await this.prisma.user.findUnique({
            where: { clerkUserId: currentUserId }
        });
        
        if (!currentUser) throw new NotFoundException('Current user not found');

        // Verify the follower exists
        const follower = await this.prisma.user.findFirst({
            where: {
                OR: [{ id: followerId }, { clerkUserId: followerId }]
            }
        });

        if (!follower) throw new NotFoundException('Follower not found');

        // Disconnect the follower from current user's followers list
        await this.prisma.user.update({
            where: { id: currentUser.id },
            data: {
                followers: {
                    disconnect: { id: follower.id }
                }
            }
        });

        return { success: true };
    }

    async deleteUserByClerkId(clerkUserId: string) {
        return this.prisma.user.delete({
            where: { clerkUserId },
        });
    }

    async sendEduVerification(clerkUserId: string) {
        const user = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!user) throw new NotFoundException('User not found');

        const email = user.email;
        if (!email || !email.endsWith('.edu')) {
            throw new BadRequestException('Your account email must be a valid .edu email address to verify.');
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        await this.prisma.verificationCode.create({
            data: {
                userId: user.id,
                code,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
            }
        });

        const resend = new Resend(process.env.RESEND_API_KEY);
        try {
            await resend.emails.send({
                from: 'Orbit <onboarding@resend.dev>',
                to: email,
                subject: 'Verify your .edu email for Orbit',
                html: `
                    <h2>Welcome to Orbit!</h2>
                    <p>Your verification code is: <strong>${code}</strong></p>
                    <p>This code will expire in 15 minutes.</p>
                `
            });
            console.log(`[EDU VERIFICATION] Sent email to ${email} successfully.`);
        } catch (error) {
            console.error('[EDU VERIFICATION] Failed to send email via Resend:', error);
            throw new BadRequestException('Failed to send verification email. Please ensure your email is correct and try again.');
        }
        
        return { message: 'Verification code sent!' };
    }

    async verifyEduCode(clerkUserId: string, code: string) {
        const user = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!user) throw new NotFoundException('User not found');

        const verificationRecord = await this.prisma.verificationCode.findFirst({
            where: {
                userId: user.id,
                code,
                expiresAt: { gt: new Date() } // Not expired
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!verificationRecord) {
            throw new BadRequestException('Invalid or expired verification code.');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { isEduVerified: true }
        });

        // Delete used code
        await this.prisma.verificationCode.deleteMany({
            where: { userId: user.id }
        });

        return { verified: true };
    }
}
