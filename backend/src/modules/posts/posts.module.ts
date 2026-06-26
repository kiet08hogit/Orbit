import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../../database/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, StorageModule, ChatModule, NotificationsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
