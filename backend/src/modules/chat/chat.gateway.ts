import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsClerkAuthGuard } from '../../common/guards/ws-clerk-auth.guard';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Allows our frontend to connect during local dev
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // A user authenticates and joins their own personal room
  @UseGuards(WsClerkAuthGuard)
  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: any) {
    const clerkUserId = client.user.clerkUserId;
    client.join(clerkUserId);
    console.log(`User ${client.user.email} joined personal room: ${clerkUserId}`);
  }

  // A user sends a new message
  @UseGuards(WsClerkAuthGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { conversationId: string; content: string; listingId?: string; replyToId?: string },
  ) {
    const { conversationId, content, listingId, replyToId } = payload;
    
    try {
      const { savedMessage, conversation } = await this.chatService.createMessage(
        client.user.clerkUserId,
        conversationId,
        content,
        listingId,
        replyToId
      );

      if (conversation) {
        conversation.members.forEach((member) => {
          this.server.to(member.user.clerkUserId).emit('receive_message', savedMessage);
        });
      }

      // AI Meetup Detection
      this.chatService.detectMeetupProposal(client.user.clerkUserId, conversationId, content)
        .then(suggestion => {
            if (suggestion) {
                this.server.to(suggestion.sellerClerkUserId).emit('ai_meetup_suggestion', suggestion.payload);
            }
        }).catch(e => console.error(e));
      
      return savedMessage;
    } catch (err) {
      console.error("Failed to process send_message:", err);
    }
  }

  // A user opens a chat and marks messages as read
  @UseGuards(WsClerkAuthGuard)
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { conversationId: string },
  ) {
    const { conversationId } = payload;
    
    try {
      const { dbUser, conversation } = await this.chatService.markConversationAsRead(
        client.user.clerkUserId,
        conversationId
      );

      // Notify the other user that their messages were read
      if (conversation) {
        conversation.members.forEach((member) => {
          if (member.user.id !== dbUser.id) {
            this.server.to(member.user.clerkUserId).emit('messages_read', { conversationId });
          }
        });
      }
    } catch (err) {
      console.error("Failed to process mark_read:", err);
    }
  }

  // Used by TransactionsService to emit meetup codes
  sendMeetupCode(buyerClerkUserId: string, payload: any) {
    this.server.to(buyerClerkUserId).emit('meetup_code_created', payload);
  }

  sendMeetupConfirmed(buyerClerkUserId: string, sellerClerkUserId: string, payload: any) {
    this.server.to(buyerClerkUserId).emit('meetup_confirmed', payload);
    this.server.to(sellerClerkUserId).emit('meetup_confirmed', payload);
  }

  sendMeetupUpdate(userId: string, payload: any) {
    this.server.to(userId).emit('meetup_update', payload);
  }
}
