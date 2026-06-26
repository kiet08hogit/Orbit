import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';
import { PostType } from '@prisma/client';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: any;
  let storageService: any;
  let chatGateway: any;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      postLike: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const mockStorageService = {
      saveFile: jest.fn(),
    };

    const mockChatGateway = {
      server: {
        emit: jest.fn(),
      },
    };

    const mockNotificationsService = {
      createNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: ChatGateway, useValue: mockChatGateway },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get(PrismaService);
    storageService = module.get(StorageService);
    chatGateway = module.get(ChatGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post with uploaded images', async () => {
      const clerkUserId = 'user_123';
      const mockUser = { id: 'db_user_123', clerkUserId };
      const createDto = { content: 'Hello World', postType: PostType.DISCUSSION };
      const files = [{ buffer: Buffer.from('img') }];
      const mockPost = { id: 'post_1', ...createDto, imageUrls: ['/uploads/test.jpg'], authorId: mockUser.id };

      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      storageService.saveFile.mockResolvedValueOnce('/uploads/test.jpg');
      prisma.post.create.mockResolvedValueOnce(mockPost);

      const result = await service.createPost(clerkUserId, createDto, files);

      expect(result).toEqual(mockPost);
      expect(storageService.saveFile).toHaveBeenCalledWith(files[0]);
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          content: 'Hello World',
          postType: PostType.DISCUSSION,
          imageUrls: ['/uploads/test.jpg'],
          isAnonymous: false,
          author: { connect: { id: mockUser.id } },
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getAllPosts', () => {
    it('should return all posts ordered by creation date', async () => {
      const mockPosts = [{ id: 'post_1' }, { id: 'post_2' }];
      prisma.post.findMany.mockResolvedValueOnce(mockPosts);

      const result = await service.getAllPosts();

      expect(result).toEqual(mockPosts);
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('toggleLike', () => {
    it('should create a like if it does not exist and emit event', async () => {
      const clerkUserId = 'user_123';
      const postId = 'post_1';
      const mockUser = { id: 'db_user_123' };
      const mockPost = { id: postId };

      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      prisma.post.findUnique.mockResolvedValueOnce(mockPost);
      prisma.postLike.findUnique.mockResolvedValueOnce(null); // No existing like
      prisma.postLike.create.mockResolvedValueOnce({ id: 'like_1' });
      prisma.postLike.count.mockResolvedValueOnce(1);

      const result = await service.toggleLike(clerkUserId, postId);

      expect(result).toEqual({ liked: true, likeCount: 1 });
      expect(prisma.postLike.create).toHaveBeenCalledWith({
        data: { postId, userId: mockUser.id }
      });
      expect(chatGateway.server.emit).toHaveBeenCalledWith('post_like_update', { postId, likeCount: 1 });
    });

    it('should delete a like if it already exists and emit event', async () => {
      const clerkUserId = 'user_123';
      const postId = 'post_1';
      const mockUser = { id: 'db_user_123' };
      const mockPost = { id: postId };
      const existingLike = { id: 'like_1' };

      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      prisma.post.findUnique.mockResolvedValueOnce(mockPost);
      prisma.postLike.findUnique.mockResolvedValueOnce(existingLike); // Existing like
      prisma.postLike.delete.mockResolvedValueOnce(existingLike);
      prisma.postLike.count.mockResolvedValueOnce(0);

      const result = await service.toggleLike(clerkUserId, postId);

      expect(result).toEqual({ liked: false, likeCount: 0 });
      expect(prisma.postLike.delete).toHaveBeenCalledWith({
        where: { id: existingLike.id }
      });
      expect(chatGateway.server.emit).toHaveBeenCalledWith('post_like_update', { postId, likeCount: 0 });
    });
  });
});
