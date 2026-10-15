import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: any;
  let chatGateway: any;
  let paymentsService: any;
  let notificationsService: any;

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
      offer: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
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
      capturePaymentAndPayout: jest.fn(),
    };

    // Mock Notifications Service
    const mockNotificationsService = {
      createNotification: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatGateway, useValue: mockChatGateway },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get(PrismaService);
    chatGateway = module.get(ChatGateway);
    paymentsService = module.get(PaymentsService);
    notificationsService = module.get(NotificationsService);
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

    it('forbids starting a meetup for a listing the caller does not own', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'seller_db_id' });
      prisma.listing.findUnique.mockResolvedValueOnce({ id: 'listing_abc', sellerId: 'other_seller' });

      await expect(service.startMeetup('seller_123', 'listing_abc', 'buyer_456'))
        .rejects.toThrow(ForbiddenException);
      expect(prisma.transaction.update).not.toHaveBeenCalled();
      expect(chatGateway.sendMeetupCode).not.toHaveBeenCalled();
    });

    it('throws NotFound when there is no active reservation', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'seller_db_id' })
        .mockResolvedValueOnce({ id: 'buyer_456', clerkUserId: 'buyer_clerk' });
      prisma.listing.findUnique.mockResolvedValueOnce({ id: 'listing_abc', sellerId: 'seller_db_id' });
      prisma.transaction.findFirst.mockResolvedValueOnce(null);

      await expect(service.startMeetup('seller_123', 'listing_abc', 'buyer_456'))
        .rejects.toThrow('No active reservation found to start meetup');
    });

    it('generates a six-digit code that expires in the future', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'seller_db_id' })
        .mockResolvedValueOnce({ id: 'buyer_456', clerkUserId: 'buyer_clerk' });
      prisma.listing.findUnique.mockResolvedValueOnce({ id: 'listing_abc', sellerId: 'seller_db_id' });
      prisma.transaction.findFirst.mockResolvedValueOnce({ id: 'tx_789' });
      prisma.transaction.update.mockResolvedValueOnce({ id: 'tx_789', listingId: 'listing_abc' });

      await service.startMeetup('seller_123', 'listing_abc', 'buyer_456');

      const { data } = prisma.transaction.update.mock.calls[0][0];
      expect(data.meetupCode).toMatch(/^\d{6}$/);
      expect(data.meetupCodeExpiresAt.getTime()).toBeGreaterThan(Date.now());
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

    const baseTx = {
      id: transactionId,
      sellerId: mockSeller.id,
      orderStatus: 'MEETING_STARTED',
      meetupCode: '482913',
      meetupVerifyAttempts: 0,
      buyer: { clerkUserId: 'buyer_123' },
      paymentMethod: 'DIRECT',
    };

    it('rejects the old 123456 master code when it is not the real code', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...baseTx, paymentMethod: 'STRIPE' });

      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, '123456'))
        .rejects.toThrow('Invalid code.');
      expect(paymentsService.capturePaymentAndPayout).not.toHaveBeenCalled();
      expect(chatGateway.sendMeetupConfirmed).not.toHaveBeenCalled();
    });

    it('rejects any code when no meetup code has been issued', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...baseTx, meetupCode: null });

      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, '482913'))
        .rejects.toThrow('Invalid code.');
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: { meetupVerifyAttempts: 1 },
      });
    });

    it('rejects codes that are not exactly six characters before touching the database', async () => {
      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, '12345'))
        .rejects.toThrow('Code must be exactly 6 digits.');
      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, ''))
        .rejects.toThrow(BadRequestException);
      expect(prisma.transaction.findUnique).not.toHaveBeenCalled();
    });

    it('locks out even the correct code after 5 failed attempts', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...baseTx, meetupVerifyAttempts: 5 });

      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, baseTx.meetupCode))
        .rejects.toThrow('Too many failed attempts. Please request a new code.');
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('increments from the current attempt count on a wrong code', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...baseTx, meetupVerifyAttempts: 3 });

      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, '000000'))
        .rejects.toThrow('Invalid code.');
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: { meetupVerifyAttempts: 4 },
      });
    });

    it.each(['COMPLETED', 'MEETUP_CONFIRMED', 'COMPLETED_BY_SELLER'])(
      'rejects a transaction that is already %s',
      async (orderStatus) => {
        prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
        prisma.transaction.findUnique.mockResolvedValueOnce({ ...baseTx, orderStatus });

        await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, baseTx.meetupCode))
          .rejects.toThrow('Meetup already confirmed.');
        expect(paymentsService.capturePaymentAndPayout).not.toHaveBeenCalled();
      },
    );

    it("forbids verifying another seller's transaction", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...baseTx, sellerId: 'other_seller' });

      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, baseTx.meetupCode))
        .rejects.toThrow(ForbiddenException);
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when the transaction does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce(null);

      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, baseTx.meetupCode))
        .rejects.toThrow(NotFoundException);
    });

    it('captures the escrowed payment for STRIPE transactions and clears the code', async () => {
      const stripeTx = { ...baseTx, paymentMethod: 'STRIPE' };
      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique
        .mockResolvedValueOnce(stripeTx)
        .mockResolvedValueOnce({ ...stripeTx, orderStatus: 'COMPLETED' });

      const result = await service.verifyMeetupCode(sellerClerkUserId, transactionId, baseTx.meetupCode);

      expect(result.message).toBe('Meetup confirmed successfully.');
      expect(paymentsService.capturePaymentAndPayout).toHaveBeenCalledWith(transactionId);
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: { meetupVerifiedAt: expect.any(Date), meetupCode: null, meetupCodeExpiresAt: null },
      });
      expect(chatGateway.sendMeetupConfirmed).toHaveBeenCalledWith(
        'buyer_123',
        undefined,
        expect.objectContaining({ status: 'COMPLETED' }),
      );
    });

    it('does not confirm the meetup if the payment capture fails', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...baseTx, paymentMethod: 'STRIPE' });
      paymentsService.capturePaymentAndPayout.mockRejectedValueOnce(new BadRequestException('Payment is not currently held'));

      await expect(service.verifyMeetupCode(sellerClerkUserId, transactionId, baseTx.meetupCode))
        .rejects.toThrow('Payment is not currently held');
      expect(chatGateway.sendMeetupConfirmed).not.toHaveBeenCalled();
    });

    it('confirms DIRECT transactions without touching Stripe', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(mockSeller);
      prisma.transaction.findUnique.mockResolvedValueOnce(baseTx);

      await service.verifyMeetupCode(sellerClerkUserId, transactionId, baseTx.meetupCode);

      expect(paymentsService.capturePaymentAndPayout).not.toHaveBeenCalled();
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: expect.objectContaining({ orderStatus: 'MEETUP_CONFIRMED', meetupCode: null }),
      });
    });
  });

  describe('createDirectReservation', () => {
    const buyer = { id: 'buyer_db', clerkUserId: 'buyer_clerk', name: 'Alex' };
    const activeListing = {
      id: 'listing_1',
      sellerId: 'seller_db',
      title: 'Desk lamp',
      price: 12.5,
      status: 'ACTIVE',
      acceptsDirectPayment: true,
    };

    it('reserves the listing and creates a DIRECT transaction at the listing price', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce(activeListing);
      prisma.offer.findFirst.mockResolvedValueOnce(null);
      prisma.transaction.create.mockResolvedValueOnce({ id: 'tx_1' });

      const result = await service.createDirectReservation(buyer.clerkUserId, activeListing.id);

      expect(result).toEqual({ id: 'tx_1' });
      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: activeListing.id },
        data: { status: 'RESERVED' },
      });
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          buyerId: buyer.id,
          sellerId: activeListing.sellerId,
          paymentMethod: 'DIRECT',
          orderStatus: 'PENDING_MEETUP',
          amount: 1250,
        }),
      });
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: activeListing.sellerId, type: 'PURCHASE' }),
      );
    });

    it('uses the accepted offer price when one exists', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce(activeListing);
      prisma.offer.findFirst.mockResolvedValueOnce({ price: 9.99 });
      prisma.transaction.create.mockResolvedValueOnce({ id: 'tx_1' });

      await service.createDirectReservation(buyer.clerkUserId, activeListing.id);

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ amount: 999 }),
      });
    });

    it('rejects buying your own listing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...buyer, id: activeListing.sellerId });
      prisma.listing.findUnique.mockResolvedValueOnce(activeListing);

      await expect(service.createDirectReservation(buyer.clerkUserId, activeListing.id))
        .rejects.toThrow('Cannot buy your own listing');
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('rejects listings that do not accept direct payment', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce({ ...activeListing, acceptsDirectPayment: false });

      await expect(service.createDirectReservation(buyer.clerkUserId, activeListing.id))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects listings that are not active', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce({ ...activeListing, status: 'SOLD' });

      await expect(service.createDirectReservation(buyer.clerkUserId, activeListing.id))
        .rejects.toThrow('Listing is not active (Status: SOLD)');
      expect(prisma.listing.update).not.toHaveBeenCalled();
    });

    it('throws NotFound for an unknown buyer or listing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.createDirectReservation('nobody', 'listing_1')).rejects.toThrow(NotFoundException);

      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce(null);
      await expect(service.createDirectReservation(buyer.clerkUserId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsSold', () => {
    const seller = { id: 'seller_db', clerkUserId: 'seller_clerk' };
    const directTx = { id: 'tx_1', sellerId: seller.id, listingId: 'listing_1', paymentMethod: 'DIRECT' };

    it('completes the transaction and marks the listing SOLD', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(seller);
      prisma.transaction.findUnique.mockResolvedValueOnce(directTx);

      await expect(service.markAsSold(seller.clerkUserId, directTx.id)).resolves.toEqual({ success: true });

      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: directTx.id },
        data: { orderStatus: 'COMPLETED_BY_SELLER' },
      });
      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: directTx.listingId },
        data: { status: 'SOLD' },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("forbids marking another seller's transaction", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(seller);
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...directTx, sellerId: 'someone_else' });

      await expect(service.markAsSold(seller.clerkUserId, directTx.id)).rejects.toThrow(ForbiddenException);
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('refuses to manually complete a STRIPE escrow transaction', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(seller);
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...directTx, paymentMethod: 'STRIPE' });

      await expect(service.markAsSold(seller.clerkUserId, directTx.id)).rejects.toThrow(BadRequestException);
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when the transaction does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(seller);
      prisma.transaction.findUnique.mockResolvedValueOnce(null);

      await expect(service.markAsSold(seller.clerkUserId, 'missing')).rejects.toThrow(NotFoundException);
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
