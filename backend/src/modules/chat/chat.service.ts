import { Injectable,NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ChatService {

    constructor(
        private prisma: PrismaService,
        @InjectQueue('upload-queue') private uploadQueue: Queue
    ) { }

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
                select: { 
                  id: true, 
                  name: true, 
                  avatarUrl: true, 
                  clerkUserId: true,
                  isEduVerified: true,
                  reviewsReceived: { select: { rating: true } }
                }
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

    async createMessage(clerkUserId: string, conversationId: string, content: string, listingId?: string, replyToId?: string) {
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
                ...(replyToId && { replyToId }),
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
                },
                replyTo: {
                    include: { sender: { select: { name: true, username: true } } }
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

    async createMessageWithImages(
        clerkUserId: string,
        conversationId: string,
        files: any[],
        content: string = '',
        replyToId?: string
    ) {
        const sender = await this.prisma.user.findUnique({
            where: { clerkUserId },
        });

        if (!sender) {
            throw new NotFoundException('User not found');
        }

        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { members: { include: { user: true } } },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Create the pending message
        const savedMessage = await this.prisma.message.create({
            data: {
                content,
                conversationId,
                senderId: sender.id,
                ...(replyToId && { replyToId }),
            },
            include: {
                sender: true,
                replyTo: {
                    include: { sender: { select: { name: true, username: true } } }
                }
            },
        });

        // Convert files to base64 for BullMQ
        const filesData = files.map(f => ({
            originalname: f.originalname,
            mimetype: f.mimetype,
            base64: f.buffer.toString('base64'),
        }));

        // Enqueue the job
        await this.uploadQueue.add('upload-images', {
            messageId: savedMessage.id,
            filesData,
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

    // Pipeline (raw text -> llm extraction (structured w/ Zod) -> database context -> web socket)
    async detectMeetupProposal(senderClerkUserId: string, conversationId: string, content: string) {
        if (!process.env.GEMINI_API_KEY) return null;
        
        // regex filtering to reduce unnecessary calls to llm
        const meetupKeywords = /meet|catch up|swap|trade|at|see|now|today|tomorrow|tonight|morning|afternoon|evening|time|pm|am|clock|building|center|hall|library|street|quad|gym|starbucks|cafe|coffee|dorm|union|commons|plaza|\d/i;

        if (!meetupKeywords.test(content)) {
            return null;
        }

        try {
            const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
            const { z } = require('zod');
            
            const llm = new ChatGoogleGenerativeAI({
                modelName: "gemini-1.5-flash",
                apiKey: process.env.GEMINI_API_KEY,
            });
            
            const schema = z.object({
                isMeetupProposal: z.boolean().describe("True if the user is proposing a specific physical meetup location and time."),
                location: z.string().nullable().describe("The physical location proposed, or null if none."),
                time: z.string().nullable().describe("The time proposed, or null if none."),
            });

            const structuredLlm = llm.withStructuredOutput(schema);

            const prompt = `Analyze this chat message between a buyer and seller: "${content}". 
            Does the user propose a specific physical meetup location and time?`;

            const parsed = await structuredLlm.invoke(prompt);

            if (parsed.isMeetupProposal && parsed.location && parsed.time) {
                const conversation = await this.prisma.conversation.findUnique({
                    where: { id: conversationId },
                    include: { members: { include: { user: true } } }
                });
                if (!conversation) return null;
                
                const sender = conversation.members.find((m: any) => m.user.clerkUserId === senderClerkUserId);
                const other = conversation.members.find((m: any) => m.user.clerkUserId !== senderClerkUserId);
                if (!sender || !other) return null;

                const transaction = await this.prisma.transaction.findFirst({
                    where: {
                        OR: [
                            { buyerId: sender.user.id, sellerId: other.user.id },
                            { buyerId: other.user.id, sellerId: sender.user.id }
                        ],
                        orderStatus: { in: ['PENDING_MEETUP', 'PAID_PENDING_MEETUP', 'MEETING_STARTED'] }
                    },
                    include: { seller: true }
                });

                if (transaction) {
                    return {
                        sellerClerkUserId: transaction.seller.clerkUserId,
                        payload: {
                            transactionId: transaction.id,
                            location: parsed.location,
                            time: parsed.time
                        }
                    };
                }
            }
        } catch (e) {
            console.error("AI detection error:", e);
        }
        return null;
    }
}
