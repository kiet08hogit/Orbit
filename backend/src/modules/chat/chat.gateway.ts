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
import { PrismaService } from '../../database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Allows our frontend to connect during local dev
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // A user joins a specific conversation "room" to listen for messages
  @UseGuards(WsClerkAuthGuard)
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: any,
    @MessageBody() conversationId: string,
  ) {
    client.join(conversationId);
    console.log(`User ${client.user.email} joined chat ${conversationId}`);
  }

  // A user sends a new message
  @UseGuards(WsClerkAuthGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { conversationId: string; content: string },
  ) {
    const { conversationId, content } = payload;

    // 1. Get the authenticated user's DB ID using the clerk ID from the Guard
    const dbUser = await this.prisma.user.findUnique({
      where: { clerkUserId: client.user.clerkUserId },
    });

    if (!dbUser) return;

    // 2. Save the new message to the database
    const savedMessage = await this.prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: dbUser.id,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, clerkUserId: true }
        }
      }
    });

    // 3. Update the conversation's updatedAt timestamp (pushes it to top of inbox)
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 4. Instantly broadcast the message to everyone in the chat room!
    this.server.to(conversationId).emit('receive_message', savedMessage);
    
    return savedMessage;
  }
}
