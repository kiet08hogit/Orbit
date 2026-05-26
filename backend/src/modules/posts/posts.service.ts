import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  async createPost(clerkUserId: string, createPostDto: CreatePostDto, files: any[]) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const imageUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const url = await this.storageService.saveFile(file);
          imageUrls.push(url);
        }
      }

      return await this.prisma.post.create({
        data: {
          content: createPostDto.content,
          postType: createPostDto.postType,
          imageUrls: imageUrls,
          author: {
            connect: { id: user.id }
          },
        },
        include: {
          author: {
            select: { name: true, username: true, avatarUrl: true },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      });
    } catch (error: any) {
      console.error("DATABASE ERROR:", error);
      throw new BadRequestException(`Database Error: ${error.message}`);
    }
  }

  async getAllPosts() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { name: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
  }
}
