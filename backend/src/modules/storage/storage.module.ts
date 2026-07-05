import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { StorageService } from './storage.service';
import { UploadProcessor } from './upload.processor';
import { PrismaModule } from '../../database/prisma.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ChatModule,
    BullModule.registerQueue({
      name: 'upload-queue',
    }),
    BullModule.registerQueue({
      name: 'image-optimization',
    }),
  ],
  providers: [StorageService, UploadProcessor],
  exports: [StorageService, BullModule],
})
export class StorageModule {}
