import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, BadGatewayException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../database/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationsService } from '../notifications/notifications.service';

const mockStripe = {
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  accountLinks: {
    create: jest.fn(),
  },
  paymentIntents: {
    create: jest.fn(),
    capture: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

// PaymentsService does `new (require('stripe'))(...)`, so return our mock from the constructor.
jest.mock('stripe', () => jest.fn().mockImplementation(() => mockStripe));

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let notificationsService: any;
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      listing: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      offer: {
        findFirst: jest.fn(),
      },
      transaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      conversation: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      message: {
        create: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TransactionsService, useValue: {} },
        { provide: NotificationsService, useValue: { createNotification: jest.fn() } },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService);
    notificationsService = module.get(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
  });

  describe('createStripeConnectAccount', () => {
    it('creates an Express account for a new seller and stores its id', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@uni.edu', stripeAccountId: null });
      mockStripe.accounts.create.mockResolvedValueOnce({ id: 'acct_new' });
      mockStripe.accountLinks.create.mockResolvedValueOnce({ url: 'https://connect.stripe.com/onboard' });

      const result = await service.createStripeConnectAccount('clerk_1');

      expect(result).toEqual({ url: 'https://connect.stripe.com/onboard' });
      expect(mockStripe.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'express', email: 'a@uni.edu' }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { stripeAccountId: 'acct_new' },
      });
      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith(
        expect.objectContaining({ account: 'acct_new', type: 'account_onboarding' }),
      );
    });

    it('reuses an existing account instead of creating a second one', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', stripeAccountId: 'acct_existing' });
      mockStripe.accountLinks.create.mockResolvedValueOnce({ url: 'https://connect.stripe.com/resume' });

      await service.createStripeConnectAccount('clerk_1');

      expect(mockStripe.accounts.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith(
        expect.objectContaining({ account: 'acct_existing' }),
      );
    });

    it('throws NotFound for an unknown user', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.createStripeConnectAccount('nobody')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyStripeConnect', () => {
    it('returns linked: false when the user has no Stripe account', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', stripeAccountId: null });

      await expect(service.verifyStripeConnect('clerk_1')).resolves.toEqual({ linked: false });
      expect(mockStripe.accounts.retrieve).not.toHaveBeenCalled();
    });

    it('marks the account linked once onboarding is complete and payouts are enabled', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', stripeAccountId: 'acct_1', stripeAccountLinked: false });
      mockStripe.accounts.retrieve.mockResolvedValueOnce({ details_submitted: true, payouts_enabled: true });

      await expect(service.verifyStripeConnect('clerk_1')).resolves.toEqual({ linked: true });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { stripeAccountLinked: true },
      });
    });

    it('returns linked: false while payouts are not enabled', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', stripeAccountId: 'acct_1', stripeAccountLinked: false });
      mockStripe.accounts.retrieve.mockResolvedValueOnce({ details_submitted: true, payouts_enabled: false });

      await expect(service.verifyStripeConnect('clerk_1')).resolves.toEqual({ linked: false });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('createPaymentIntent', () => {
    const buyer = { id: 'buyer_db', clerkUserId: 'buyer_clerk' };
    const listing = {
      id: 'listing_1',
      sellerId: 'seller_db',
      price: 25.5,
      status: 'ACTIVE',
      acceptsProtectedPayment: true,
      seller: { stripeAccountLinked: true, stripeAccountId: 'acct_seller' },
    };

    it('creates a manual-capture PaymentIntent routed to the seller', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce(listing);
      prisma.offer.findFirst.mockResolvedValueOnce(null);
      mockStripe.paymentIntents.create.mockResolvedValueOnce({ id: 'pi_1', client_secret: 'secret_1' });

      const result = await service.createPaymentIntent(buyer.clerkUserId, listing.id);

      expect(result).toEqual({ clientSecret: 'secret_1', paymentIntentId: 'pi_1' });
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2550,
          currency: 'usd',
          capture_method: 'manual',
          transfer_data: { destination: 'acct_seller' },
        }),
      );
      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: listing.id },
        data: { status: 'PENDING_PAYMENT' },
      });
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentMethod: 'STRIPE',
          paymentStatus: 'UNPAID',
          stripePaymentIntentId: 'pi_1',
          amount: 2550,
        }),
      });
    });

    it('charges the accepted offer price instead of the listing price', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce(listing);
      prisma.offer.findFirst.mockResolvedValueOnce({ price: 20 });
      mockStripe.paymentIntents.create.mockResolvedValueOnce({ id: 'pi_1', client_secret: 'secret_1' });

      await service.createPaymentIntent(buyer.clerkUserId, listing.id);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 2000 }));
    });

    it('rejects buying your own listing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ ...buyer, id: listing.sellerId });
      prisma.listing.findUnique.mockResolvedValueOnce(listing);

      await expect(service.createPaymentIntent(buyer.clerkUserId, listing.id))
        .rejects.toThrow('Cannot buy your own listing');
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it.each(['SOLD', 'RESERVED', 'PENDING_PAYMENT'])('rejects a listing that is %s', async (status) => {
      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce({ ...listing, status });

      await expect(service.createPaymentIntent(buyer.clerkUserId, listing.id)).rejects.toThrow(BadRequestException);
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('rejects listings that do not accept protected payments', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce({ ...listing, acceptsProtectedPayment: false });

      await expect(service.createPaymentIntent(buyer.clerkUserId, listing.id))
        .rejects.toThrow('This listing does not accept protected payments');
    });

    it('rejects when the seller has not finished Stripe onboarding', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce({
        ...listing,
        seller: { stripeAccountLinked: false, stripeAccountId: 'acct_seller' },
      });

      await expect(service.createPaymentIntent(buyer.clerkUserId, listing.id))
        .rejects.toThrow('Seller has not connected their bank account yet');
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('throws NotFound for an unknown buyer or listing', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.createPaymentIntent('nobody', listing.id)).rejects.toThrow(NotFoundException);

      prisma.user.findUnique.mockResolvedValueOnce(buyer);
      prisma.listing.findUnique.mockResolvedValueOnce(null);
      await expect(service.createPaymentIntent(buyer.clerkUserId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('capturePaymentAndPayout', () => {
    const heldTx = { id: 'tx_1', listingId: 'listing_1', paymentStatus: 'PAID_HELD', stripePaymentIntentId: 'pi_1' };

    it('captures the held payment, completes the transaction and marks the listing SOLD', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(heldTx);
      mockStripe.paymentIntents.capture.mockResolvedValueOnce({ id: 'pi_1', status: 'succeeded' });

      const result = await service.capturePaymentAndPayout(heldTx.id);

      expect(result.success).toBe(true);
      expect(mockStripe.paymentIntents.capture).toHaveBeenCalledWith('pi_1');
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: heldTx.id },
        data: { paymentStatus: 'RELEASED_TO_SELLER', orderStatus: 'COMPLETED' },
      });
      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: heldTx.listingId },
        data: { status: 'SOLD' },
      });
    });

    it('refuses to capture when the payment is not held', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...heldTx, paymentStatus: 'UNPAID' });

      await expect(service.capturePaymentAndPayout(heldTx.id)).rejects.toThrow('Payment is not currently held');
      expect(mockStripe.paymentIntents.capture).not.toHaveBeenCalled();
    });

    it('refuses to capture without a PaymentIntent id', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce({ ...heldTx, stripePaymentIntentId: null });

      await expect(service.capturePaymentAndPayout(heldTx.id)).rejects.toThrow('No Stripe PaymentIntent associated');
    });

    it('throws NotFound for an unknown transaction', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(null);
      await expect(service.capturePaymentAndPayout('missing')).rejects.toThrow(NotFoundException);
    });

    it('does not complete the sale when the Stripe capture fails', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(heldTx);
      mockStripe.paymentIntents.capture.mockRejectedValueOnce(new Error('card_declined'));

      await expect(service.capturePaymentAndPayout(heldTx.id)).rejects.toBeInstanceOf(BadGatewayException);
      expect(prisma.transaction.update).not.toHaveBeenCalled();
      expect(prisma.listing.update).not.toHaveBeenCalled();
    });

    it('does not report a failed capture when the database update fails after Stripe captured', async () => {
      prisma.transaction.findUnique.mockResolvedValueOnce(heldTx);
      mockStripe.paymentIntents.capture.mockResolvedValueOnce({ id: 'pi_1', status: 'succeeded' });
      const dbError = new Error('connection lost');
      prisma.$transaction.mockRejectedValueOnce(dbError);
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const attempt = service.capturePaymentAndPayout(heldTx.id);

      await expect(attempt).rejects.toBe(dbError);
      await expect(attempt).rejects.not.toBeInstanceOf(BadGatewayException);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Stripe capture succeeded for PaymentIntent pi_1'));
      consoleError.mockRestore();
    });
  });

  describe('handleWebhook', () => {
    const body = Buffer.from('{}');
    const tx = { id: 'tx_1', listingId: 'listing_1', buyerId: 'buyer_db', sellerId: 'seller_db' };

    beforeEach(() => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    });

    it('rejects events with an invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('No signatures found matching the expected signature');
      });

      await expect(service.handleWebhook('bad_sig', body)).rejects.toThrow(BadRequestException);
      expect(prisma.transaction.findUnique).not.toHaveBeenCalled();
    });

    it('verifies the signature against the configured secret', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValueOnce({ type: 'customer.created', data: { object: {} } });

      await expect(service.handleWebhook('sig', body)).resolves.toEqual({ received: true });
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(body, 'sig', 'whsec_test');
    });

    it('moves funds to PAID_HELD and reserves the listing when the payment is authorized', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValueOnce({
        type: 'payment_intent.amount_capturable_updated',
        data: { object: { id: 'pi_1' } },
      });
      prisma.transaction.findUnique.mockResolvedValueOnce(tx);
      prisma.conversation.findFirst.mockResolvedValueOnce(null);
      prisma.conversation.create.mockResolvedValueOnce({ id: 'conv_1' });
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'buyer_db', name: 'Alex' });
      prisma.listing.findUnique.mockResolvedValueOnce({ id: 'listing_1', title: 'Desk lamp' });

      await service.handleWebhook('sig', body);

      expect(prisma.transaction.findUnique).toHaveBeenCalledWith({ where: { stripePaymentIntentId: 'pi_1' } });
      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: tx.id },
        data: { paymentStatus: 'PAID_HELD', orderStatus: 'PAID_PENDING_MEETUP' },
      });
      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: tx.listingId },
        data: { status: 'RESERVED' },
      });
      expect(notificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: tx.sellerId, type: 'PURCHASE' }),
      );
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ senderId: tx.buyerId, conversationId: 'conv_1' }),
      });
    });

    it('reuses an existing buyer/seller conversation', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValueOnce({
        type: 'payment_intent.amount_capturable_updated',
        data: { object: { id: 'pi_1' } },
      });
      prisma.transaction.findUnique.mockResolvedValueOnce(tx);
      prisma.conversation.findFirst.mockResolvedValueOnce({ id: 'conv_existing' });
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.listing.findUnique.mockResolvedValueOnce(null);

      await service.handleWebhook('sig', body);

      expect(prisma.conversation.create).not.toHaveBeenCalled();
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ conversationId: 'conv_existing' }),
      });
    });

    it('cancels the transaction and relists the item when the payment fails', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValueOnce({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_1' } },
      });
      prisma.transaction.findUnique.mockResolvedValueOnce(tx);

      await service.handleWebhook('sig', body);

      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: tx.id },
        data: { paymentStatus: 'UNPAID', orderStatus: 'CANCELLED' },
      });
      expect(prisma.listing.update).toHaveBeenCalledWith({
        where: { id: tx.listingId },
        data: { status: 'ACTIVE' },
      });
    });

    it('ignores events for unknown PaymentIntents', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValueOnce({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_unknown' } },
      });
      prisma.transaction.findUnique.mockResolvedValueOnce(null);

      await expect(service.handleWebhook('sig', body)).resolves.toEqual({ received: true });
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it('rejects unsigned events when no webhook secret is configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const forged = Buffer.from(JSON.stringify({
        type: 'payment_intent.amount_capturable_updated',
        data: { object: { id: 'pi_1' } },
      }));

      await expect(service.handleWebhook('', forged)).rejects.toThrow();
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });
  });
});
