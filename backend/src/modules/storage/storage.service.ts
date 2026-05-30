import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectQueue('image-optimization') private imageQueue: Queue
  ) {
    // Ensure the uploads directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: any): Promise<string> {
    try {
      // Generate a unique filename using uuid and the original extension
      const fileExt = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExt}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);

      // Write the file buffer to the uploads directory
      fs.writeFileSync(filePath, file.buffer);

      // Add a job to the background queue for asynchronous processing
      await this.imageQueue.add('optimize', { filename: uniqueFilename });

      // Return the public URL path
      return `/uploads/${uniqueFilename}`;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new InternalServerErrorException('Failed to save file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract just the filename from the URL path
      const filename = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
