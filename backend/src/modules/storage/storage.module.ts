import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'image-optimization',
    }),
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
