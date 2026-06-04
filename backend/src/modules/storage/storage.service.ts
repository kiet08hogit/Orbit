import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  constructor(private configService: ConfigService) {}

  private getS3Client(): S3Client {
    return new S3Client({
      region: this.configService.get<string>('AWS_REGION')?.replace(/['"\s]/g, '') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')?.replace(/['"\s]/g, '') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')?.replace(/['"\s]/g, '') || '',
      },
    });
  }

  private getBucketName(): string {
    return this.configService.get<string>('AWS_S3_BUCKET_NAME')?.replace(/['"\s]/g, '') || '';
  }

  async saveFile(file: any): Promise<string> {
    try {
      // Generate a unique filename using uuid and the original extension
      const fileExt = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExt}`;
      // Upload to S3
      const bucketName = this.getBucketName();
      const s3Client = this.getS3Client();

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFilename,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      // Return the public S3 URL
      const region = this.configService.get<string>('AWS_REGION')?.replace(/['"\s]/g, '') || 'us-east-1';
      return `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueFilename}`;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl.includes('s3.amazonaws.com')) return;

      // Extract just the filename from the S3 URL
      const urlParts = fileUrl.split('/');
      const filename = urlParts[urlParts.length - 1];

      const bucketName = this.getBucketName();
      const s3Client = this.getS3Client();

      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: filename,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
    }
  }
}
