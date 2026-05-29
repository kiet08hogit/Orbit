import { Test, TestingModule } from '@nestjs/testing';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext } from '@nestjs/common';
import { ListingStatus, ListingCategory } from '@prisma/client';

describe('ListingsController', () => {
  let controller: ListingsController;
  let service: ListingsService;

  const mockListingsService = {
    findLatestListings: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    getSwipeFeed: jest.fn(),
    getUserListings: jest.fn(),
    getWishlist: jest.fn(),
    recordSwipe: jest.fn(),
    deleteListing: jest.fn(),
    updateListing: jest.fn(),
  };

  const mockClerkAuthGuard = {
    canActivate: (context: ExecutionContext) => true,
  };

  const mockCacheInterceptor = {
    intercept: (context: ExecutionContext, next: any) => next.handle(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingsController],
      providers: [
        {
          provide: ListingsService,
          useValue: mockListingsService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue(mockClerkAuthGuard)
      .overrideInterceptor(CacheInterceptor)
      .useValue(mockCacheInterceptor)
      .compile();

    controller = module.get<ListingsController>(ListingsController);
    service = module.get<ListingsService>(ListingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllListings', () => {
    it('should return an array of listings', async () => {
      const result = [
        { 
          id: '1', 
          title: 'Test Listing', 
          description: 'Test', 
          price: 10, 
          category: ListingCategory.OTHER, 
          status: ListingStatus.ACTIVE, 
          sellerId: '123', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }
      ];
      mockListingsService.findLatestListings.mockResolvedValue(result);

      expect(await controller.getAllListings(ListingCategory.OTHER, 'test')).toBe(result);
      expect(mockListingsService.findLatestListings).toHaveBeenCalledWith(ListingCategory.OTHER, 'test');
    });
  });

  describe('getListing', () => {
    it('should return a single listing', async () => {
      const result = { 
        id: '1', 
        title: 'Test Listing', 
        description: 'Test', 
        price: 10, 
        category: ListingCategory.OTHER, 
        status: ListingStatus.ACTIVE, 
        sellerId: '123', 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      mockListingsService.findById.mockResolvedValue(result);

      expect(await controller.getListing('1')).toBe(result);
      expect(mockListingsService.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if listing not found', async () => {
      mockListingsService.findById.mockResolvedValue(null);
      await expect(controller.getListing('999')).rejects.toThrow('Listing not found');
    });
  });
});
