import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../../database/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, StorageModule, ChatModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
