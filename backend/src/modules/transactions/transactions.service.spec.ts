import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { PaymentsService } from '../payments/payments.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: any;
  let chatGateway: any;
  let paymentsService: any;

  beforeEach(async () => {
    // Mock the Prisma Service
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      listing: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    // Mock Chat Gateway
    const mockChatGateway = {
      sendMeetupCode: jest.fn(),
      sendMeetupConfirmed: jest.fn(),
      server: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      },
    };

    // Mock Payments Service
    const mockPaymentsService = {
      createCheckoutSession: jest.fn(),
      createConnectAccount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatGateway, useValue: mockChatGateway },
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get(PrismaService);
    chatGateway = module.get(ChatGateway);
    paymentsService = module.get(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startMeetup', () => {
    it('should generate a code, update transaction, and emit via gateway', async () => {
      // Mock data
      const sellerClerkUserId = 'seller_123';
      const listingId = 'listing_abc';
      const buyerId = 'buyer_456';
      
      const mockSeller = { id: 'seller_db_id', clerkUserId: sellerClerkUserId };
      const mockBuyer = { id: buyerId, clerkUserId: 'buyer_clerk_456' };
      const mockListing = { id: listingId, sellerId: mockSeller.id };
      const mockTransaction = { id: 'tx_789', listingId, buyerId, sellerId: mockSeller.id };
      const updatedTransaction = { ...mockTransaction, orderStatus: 'MEETING_STARTED', meetupCode: '123456' };

      // Setup prisma mocks
      prisma.user.findUnique
        .mockResolvedValueOnce(mockSeller) // First call: seller
        .mockResolvedValueOnce(mockBuyer); // Second call: buyer
      prisma.listing.findUnique.mockResolvedValueOnce(mockListing);
      prisma.transaction.findFirst.mockResolvedValueOnce(mockTransaction);
      prisma.transaction.update.mockResolvedValueOnce(updatedTransaction);

      // Call service
      const result = await service.startMeetup(sellerClerkUserId, listingId, buyerId);

      // Assertions
      expect(result.message).toBe('Verification code sent to the buyer in the app.');
      expect(prisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockTransaction.id },
          data: expect.objectContaining({
            orderStatus: 'MEETING_STARTED',
            meetupCode: expect.any(String),
            meetupVerifyAttempts: 0,
          }),
        }),
      );
      expect(chatGateway.sendMeetupCode).toHaveBeenCalledWith(
        mockBuyer.clerkUserId,
        expect.objectContaining({
          transactionId: mockTransaction.id,
          listingId: mockListing.id,
          code: expect.any(String),
        })
      );
    });

    it('should throw NotFoundException if seller not found', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.startMeetup('invalid_seller', 'listing', 'buyer'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyMeetupCode', () => {
    const sellerClerkUserId = 'seller_123';
    const transactionId = 'tx_789';
    const validCode = '123456';
    const mockSeller = { id: 'seller_db_id' };

    it('should confirm meetup if code is correct', async () => {
      const mockTransaction = { 
        id: transactionId, 
        sellerId: mockSeller.id, 
        orderStatus: 'MEETING_STARTED',
        meetupCode: validCode,
        meetupVerifyAttempts: 0,
        meetupCodeExpiresAt: new Date(Date.now() + 100000),
        buyer: { clerkUserId: 'buyer_123' },
        paymentMethod: 'DIRECT'
      };

      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction);
      prisma.transaction.update.mockResolvedValueOnce({ ...mockTransaction, orderStatus: 'MEETUP_CONFIRMED' });

      const result = await service.verifyMeetupCode(sellerClerkUserId, transactionId, validCode);

      expect(result.message).toBe('Meetup confirmed successfully.');
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: {
          orderStatus: 'MEETUP_CONFIRMED',
          meetupCode: null,
          meetupCodeExpiresAt: null,
          meetupVerifiedAt: expect.any(Date),
        }
      });
      // The service also calls chatGateway.sendMeetupConfirmed()
      expect(chatGateway.sendMeetupConfirmed).toHaveBeenCalled();
    });

    it('should increment attempts and throw BadRequest if code is invalid', async () => {
      const mockTransaction = { 
        id: transactionId, 
        sellerId: mockSeller.id, 
        orderStatus: 'MEETING_STARTED',
        meetupCode: validCode,
        meetupVerifyAttempts: 0,
        meetupCodeExpiresAt: new Date(Date.now() + 100000)
      };

      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction);
      // Mock the update for incrementing attempts
      prisma.transaction.update.mockResolvedValueOnce({ ...mockTransaction, meetupVerifyAttempts: 1 });

      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, '000000'))
        .rejects.toThrow(BadRequestException);
      
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: { meetupVerifyAttempts: 1 }
      });
    });

    it('should block if max attempts reached', async () => {
      const mockTransaction = { 
        id: transactionId, 
        sellerId: mockSeller.id, 
        orderStatus: 'MEETING_STARTED',
        meetupCode: validCode,
        meetupVerifyAttempts: 5,
        meetupCodeExpiresAt: new Date(Date.now() + 100000)
      };

      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce(mockTransaction);

      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, '000000'))
        .rejects.toThrow('Too many failed attempts. Please request a new code.');
    });
  });

  describe('getActiveSellerTransactions', () => {
    it('should return active transactions for a seller', async () => {
      const clerkUserId = 'seller_123';
      const mockSeller = { id: 'seller_db_id' };
      const mockTransactions = [{ id: '1' }, { id: '2' }];

      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findMany.mockResolvedValueOnce(mockTransactions);

      const result = await service.getActiveSellerTransactions(clerkUserId);

      expect(result).toEqual(mockTransactions);
      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sellerId: mockSeller.id,
            orderStatus: {
              in: ['PENDING_MEETUP', 'PAID_PENDING_MEETUP', 'MEETING_STARTED', 'MEETUP_CONFIRMED', 'COMPLETED_BY_SELLER']
            }
          }
        })
      );
    });
  });
});
