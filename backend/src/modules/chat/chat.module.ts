import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'upload-queue',
    }),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatGateway],
})
export class ChatModule {}
