import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { StorageModule } from '../storage/storage.module';
import { AiModule } from '../ai/ai.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [StorageModule, AiModule, ChatModule],
  controllers: [ListingsController],
  providers: [ListingsService]
})
export class ListingsModule {}
