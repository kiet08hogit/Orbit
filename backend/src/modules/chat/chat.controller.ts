import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
    ) {}

    // Get a new chat for new listing if already existed just return old one
    @Post('conversation/:otherUserId')
    @UseGuards(ClerkAuthGuard)
    async startConversation(
        @CurrentUser() currentUser: { clerkUserId: string, email: string },
        @Param('otherUserId') otherUserId: string,
    ) {
        return this.chatService.getOrCreateConversation(currentUser.clerkUserId, otherUserId);
    }

    // Get all conversations with latest message
    @Get('inbox')
    @UseGuards(ClerkAuthGuard)
    async getInbox(@CurrentUser() currentUser: { clerkUserId: string, email: string }) {
        return this.chatService.getUserInboxConversations(currentUser.clerkUserId);
    }

    // Get messages of a conversation
    @Get('inbox/:id')
    @UseGuards(ClerkAuthGuard)
    async getConversation(@Param('id') id: string) {
        return this.chatService.getSpecificConversation(id);
    }

    // @Post('message/:conversationId')
    // @UseGuards(ClerkAuthGuard)
    // async sendMessage(
    //     @CurrentUser() currentUser: any,
    //     @Param('conversationId') conversationId: string,
    //     @Body('content') content: string,
    // ) {
        // return this.chatService.sendMessage(conversationId, currentUser.id, content);
    // }

}
