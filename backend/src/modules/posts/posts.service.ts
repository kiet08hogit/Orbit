import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ChatGateway } from '../chat/chat.gateway';


@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private chatGateway: ChatGateway
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

  async getAllPosts(clerkUserId?: string) {
    const user = clerkUserId ? await this.prisma.user.findUnique({ where: { clerkUserId } }) : null;

    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { name: true, username: true, avatarUrl: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        likes: user ? {
          where: { userId: user.id },
          select: { userId: true },
        } : false,
      },
    });
  }

  async toggleLike(clerkUserId: string, postId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: user.id,
        },
      },
    });

    let isLiked = false;

    if (existingLike) {
      await this.prisma.postLike.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      await this.prisma.postLike.create({
        data: {
          postId: postId,
          userId: user.id,
        },
      });
      isLiked = true;
    }

    const likeCount = await this.prisma.postLike.count({ where: { postId } });

    // Broadcast the update
    this.chatGateway.server.emit('post_like_update', { postId, likeCount });

    return { liked: isLiked, likeCount };
  }

  async createComment(clerkUserId: string, postId: string, content: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const newComment = await this.prisma.postComment.create({
      data: {
        content,
        postId,
        authorId: user.id,
      },
      include: {
        author: {
          select: { name: true, username: true, avatarUrl: true },
        },
      },
    });

    const commentCount = await this.prisma.postComment.count({ where: { postId } });

    // Broadcast the new comment
    this.chatGateway.server.emit('post_comment_added', { postId, comment: newComment, commentCount });

    return { comment: newComment, commentCount };
  }

  async getComments(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { name: true, username: true, avatarUrl: true },
        },
      },
    });
  }
}
