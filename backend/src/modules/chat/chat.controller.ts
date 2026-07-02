import { Controller, Get, Post, Param, Body, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
    ) {}

    // Get a new chat for new listing if already existed just return old one
    @Post('conversation/:otherUserId')
    @UseGuards(ClerkAuthGuard)
    async startConversation(
        @CurrentUser() currentUser: AuthUser,
        @Param('otherUserId') otherUserId: string,
    ) {
        return this.chatService.getOrCreateConversation(currentUser.clerkUserId, otherUserId);
    }

    @Get('unread-count')
    @UseGuards(ClerkAuthGuard)
    async getUnreadCount(@CurrentUser() currentUser: AuthUser) {
        const count = await this.chatService.getUnreadCount(currentUser.clerkUserId);
        return { count };
    }

    // Get all conversations with latest message
    @Get('inbox')
    @UseGuards(ClerkAuthGuard)
    async getInbox(@CurrentUser() currentUser: AuthUser) {
        return this.chatService.getUserInboxConversations(currentUser.clerkUserId);
    }

    // Get messages of a conversation
    @Get('inbox/:id')
    @UseGuards(ClerkAuthGuard)
    async getConversation(@Param('id') id: string) {
        return this.chatService.getSpecificConversation(id);
    }



    @Post('message/:conversationId/images')
    @UseGuards(ClerkAuthGuard)
    @UseInterceptors(FilesInterceptor('images', 5))
    async sendImageMessage(
        @CurrentUser() currentUser: AuthUser,
        @Param('conversationId') conversationId: string,
        @UploadedFiles() files: any[],
        @Body('content') content?: string,
        @Body('replyToId') replyToId?: string,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('Images required');
        }
        
        const { savedMessage, conversation } = await this.chatService.createMessageWithImages(
            currentUser.clerkUserId,
            conversationId,
            files,
            content || '',
            replyToId
        );
        
        return savedMessage;
    }
}
