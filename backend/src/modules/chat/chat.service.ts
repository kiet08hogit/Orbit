import { Injectable,NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ChatService {

    constructor(private prisma: PrismaService) { }

    async getOrCreateConversation(currentclerkUserId: string, otherClerkId: string) {
            const currentUser = await this.prisma.user.findUnique({
                where: { clerkUserId:currentclerkUserId },
            });
            if (!currentUser) throw new NotFoundException("User not found");

            const otherUser = await this.prisma.user.findUnique({
                where: { clerkUserId: otherClerkId },
            });
            if (!otherUser) throw new NotFoundException("User not found");

            const conversation = await this.prisma.conversation.findFirst({
                where: {
                    AND:[
                        {
                            members: {
                                some: {
                                    userId: currentUser.id,
                                },
                            },
                        },
                        {
                            members: {
                                some: {
                                    userId: otherUser.id,
                                },
                            },
                        }
                        
                    ],
                },
            });
        if (!conversation) {
            const membersToCreate = currentUser.id === otherUser.id
                ? [{ userId: currentUser.id }]
                : [{ userId: currentUser.id }, { userId: otherUser.id }];

            const conversationCreated = await this.prisma.conversation.create({
                data: {
                    members: {
                        create: membersToCreate,
                    },
                },
            });
            return conversationCreated;
        }
        return conversation;
    }

    async getUserInboxConversations(clerkUserId: string) {
        const user = await this.prisma.user.findUnique({
        where: { clerkUserId },
        });
        if (!user) throw new NotFoundException('User not found');
        return this.prisma.conversation.findMany({
        where: {
            members: { some: { userId: user.id } },
        },
        include: {
            // Including the details of the users in the chat (like name and avatar)
            members: {
            include: {
                user: {
                select: { id: true, name: true, avatarUrl: true, clerkUserId: true }
                }
            }
            },
            // fetching the most recent message to show a preview in the inbox sidebar
            messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, 
            },
        },
        orderBy: { updatedAt: 'desc' },
        });
    }

    async getSpecificConversation(conversationId: string) {
        return this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' }, // Older messages at the top, newest at bottom
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true, clerkUserId: true }
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        images: { take: 1 }
                    }
                }
            }
        });
    }

    async getUnreadCount(clerkUserId: string) {
        const user = await this.prisma.user.findUnique({ where: { clerkUserId } });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.message.count({
            where: {
                conversation: {
                    members: { some: { userId: user.id } }
                },
                senderId: { not: user.id },
                isRead: false
            }
        });
    }

    async createMessage(clerkUserId: string, conversationId: string, content: string, listingId?: string) {
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId },
        });
        if (!dbUser) throw new NotFoundException('User not found');

        const savedMessage = await this.prisma.message.create({
            data: {
                content,
                conversationId,
                senderId: dbUser.id,
                ...(listingId && { listingId }),
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true, clerkUserId: true }
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        images: { take: 1 }
                    }
                }
            }
        });

        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { members: { include: { user: true } } }
        });

        return { savedMessage, conversation };
    }

    async markConversationAsRead(clerkUserId: string, conversationId: string) {
        const dbUser = await this.prisma.user.findUnique({
            where: { clerkUserId },
        });
        if (!dbUser) throw new NotFoundException('User not found');

        await this.prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: dbUser.id },
                isRead: false
            },
            data: { isRead: true }
        });

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { members: { include: { user: true } } }
        });

        return { dbUser, conversation };
    }
}

