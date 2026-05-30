import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('image-optimization')
export class ImageProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`[BACKGROUND JOB STARTED] Optimizing image: ${job.data.filename} (Job ID: ${job.id})`);

    // Simulate heavy image processing (e.g., resizing, compressing, uploading to S3)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    this.logger.log(`[BACKGROUND JOB COMPLETED] Successfully optimized: ${job.data.filename} (Job ID: ${job.id})`);
    
    return { success: true, optimizedUrl: job.data.filename };
  }
}
