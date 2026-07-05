import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { StorageService } from './storage.service';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Processor('upload-queue')
export class UploadProcessor extends WorkerHost {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { messageId, filesData } = job.data;
    const imageUrls: string[] = [];

    try {
      for (const fileData of filesData) {
        // Reconstruct a file-like object from base64
        const buffer = Buffer.from(fileData.base64, 'base64');
        const file = {
          originalname: fileData.originalname,
          mimetype: fileData.mimetype,
          buffer,
        };

        const url = await this.storageService.saveFile(file);
        imageUrls.push(url);
      }

      // Update the message in DB
      const updatedMessage = await this.prisma.message.update({
        where: { id: messageId },
        data: { imageUrls },
        include: { sender: true },
      });

      // Broadcast event so frontend can swap loading spinner with actual images
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: updatedMessage.conversationId },
        include: { members: { include: { user: true } } },
      });

      if (conversation) {
        conversation.members.forEach((member) => {
          this.chatGateway.server
            .to(member.user.clerkUserId)
            .emit('message_images_uploaded', updatedMessage);
        });
      }

      return updatedMessage;
    } catch (error) {
      console.error('Failed to process image upload job', error);
      throw error;
    }
  }
}
