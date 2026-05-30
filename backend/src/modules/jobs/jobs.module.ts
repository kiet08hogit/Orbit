import { Module } from '@nestjs/common';
import { ImageProcessor } from './image-processor.processor';

@Module({
  providers: [ImageProcessor],
})
export class JobsModule {}
