import { Test, TestingModule } from '@nestjs/testing';
import { ListingsService } from './listings.service';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NotFoundException } from '@nestjs/common';
import { InteractionType, ListingStatus, ListingCategory } from '@prisma/client';

describe('ListingsService', () => {
  let service: ListingsService;
  let prisma: any;
  let storageService: any;
  let aiService: any;
  let chatGateway: any;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      listing: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      listingImage: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      interaction: {
        upsert: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn(),
    };

    const mockStorageService = {
      saveFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const mockAiService = {
      generateEmbedding: jest.fn(),
    };

    const mockChatGateway = {
      server: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: AiService, useValue: mockAiService },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    prisma = module.get(PrismaService);
    storageService = module.get(StorageService);
    aiService = module.get(AiService);
    chatGateway = module.get(ChatGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a listing and its images, and save AI embedding', async () => {
      const clerkUserId = 'user_123';
      const email = 'test@test.com';
      const createDto: any = {
        title: 'MacBook Pro',
        description: 'M1 chip',
        price: 1000,
        category: ListingCategory.OTHER,
      };
      const files = [{ buffer: Buffer.from('test') }];
      const mockUser = { id: 'db_user_123', clerkUserId };
      const mockListing = { id: 'listing_123', ...createDto, sellerId: mockUser.id };

      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      prisma.listing.create.mockResolvedValueOnce(mockListing);
      aiService.generateEmbedding.mockResolvedValueOnce([0.1, 0.2, 0.3]);
      storageService.saveFile.mockResolvedValueOnce('/uploads/img.jpg');

      const result = await service.create(clerkUserId, email, createDto, files);

      expect(result).toEqual(mockListing);
      expect(prisma.listing.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'MacBook Pro',
          price: 1000,
          status: ListingStatus.ACTIVE,
          sellerId: mockUser.id,
        })
      });
      expect(aiService.generateEmbedding).toHaveBeenCalled();
      expect(prisma.$executeRaw).toHaveBeenCalled();
      expect(storageService.saveFile).toHaveBeenCalledWith(files[0]);
      expect(prisma.listingImage.create).toHaveBeenCalledWith({
        data: { url: '/uploads/img.jpg', listingId: mockListing.id }
      });
    });
  });

  describe('getSwipeFeed', () => {
    it('should return active listings excluding user own items and previously interacted items', async () => {
      const clerkUserId = 'user_123';
      const mockUser = { id: 'db_user_123' };
      const mockFeed = [{ id: 'listing_1' }, { id: 'listing_2' }];

      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      prisma.listing.findMany.mockResolvedValueOnce(mockFeed);

      const result = await service.getSwipeFeed(clerkUserId, 10);

      expect(result).toEqual(mockFeed);
      expect(prisma.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'ACTIVE',
            sellerId: { not: mockUser.id },
            interactions: { none: { userId: mockUser.id } }
          },
          take: 10,
        })
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.getSwipeFeed('invalid_user', 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordSwipe', () => {
    it('should upsert interaction and emit websocket event for wishlist update', async () => {
      const clerkUserId = 'user_123';
      const listingId = 'listing_abc';
      const type = InteractionType.LIKE;
      const mockUser = { id: 'db_user_123', clerkUserId };
      const mockInteraction = { id: 'int_1', userId: mockUser.id, listingId, type };

      prisma.user.findUnique.mockResolvedValueOnce(mockUser);
      prisma.interaction.upsert.mockResolvedValueOnce(mockInteraction);

      const result = await service.recordSwipe(clerkUserId, listingId, type);

      expect(result).toEqual(mockInteraction);
      expect(prisma.interaction.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_listingId: { userId: mockUser.id, listingId } },
          update: { type },
          create: { userId: mockUser.id, listingId, type }
        })
      );
      expect(chatGateway.server.to).toHaveBeenCalledWith(clerkUserId);
      expect(chatGateway.server.to().emit).toHaveBeenCalledWith('update_wishlist_count');
    });
  });
});
