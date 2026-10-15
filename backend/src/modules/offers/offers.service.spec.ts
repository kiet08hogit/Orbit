import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ListingStatus, OfferStatus } from '@prisma/client';
import { OffersService } from './offers.service';
import { PrismaService } from '../../database/prisma.service';
import { ChatService } from '../chat/chat.service';
import { CreateOfferDto } from './dto/create-offer.dto';

describe('OffersService', () => {
  let service: OffersService;
  let prisma: any;
  let chatService: any;

  const buyer = { id: 'buyer-db', clerkUserId: 'buyer-clerk' };
  const seller = { id: 'seller-db', clerkUserId: 'seller-clerk' };
  const listing = { id: 'listing-1', sellerId: seller.id, price: 100, status: ListingStatus.ACTIVE };
  const pendingOffer = {
    id: 'offer-1',
    buyerId: buyer.id,
    listingId: listing.id,
    status: OfferStatus.PENDING,
    listing,
  };

  beforeEach(async () => {
    const tx = { offer: { update: jest.fn(), updateMany: jest.fn() } };
    const mockPrisma = {
      user: { findUnique: jest.fn() },
      listing: { findUnique: jest.fn() },
      offer: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      conversation: { findFirst: jest.fn(), create: jest.fn() },
      $transaction: jest.fn((fn: any) => fn(tx)),
      tx,
    };
    const mockChatService = { createMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatService, useValue: mockChatService },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
    prisma = module.get(PrismaService);
    chatService = module.get(ChatService);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  describe('CreateOfferDto validation', () => {
    it.each([0, -5])('rejects a price of %p', async (price) => {
      const dto = plainToInstance(CreateOfferDto, { listingId: 'listing-1', price });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'price')).toBe(true);
    });

    it('accepts a positive price', async () => {
      const dto = plainToInstance(CreateOfferDto, { listingId: 'listing-1', price: 50 });
      expect(await validate(dto)).toHaveLength(0);
    });
  });

  describe('createOffer', () => {
    it('throws NotFound when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.createOffer('ghost', { listingId: listing.id, price: 50 }))
        .rejects.toThrow(NotFoundException);
    });

    it('throws NotFound when the listing does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.listing.findUnique.mockResolvedValue(null);
      await expect(service.createOffer(buyer.clerkUserId, { listingId: 'nope', price: 50 }))
        .rejects.toThrow(NotFoundException);
    });

    it('rejects offers on a listing that is no longer active', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.listing.findUnique.mockResolvedValue({ ...listing, status: ListingStatus.SOLD });
      await expect(service.createOffer(buyer.clerkUserId, { listingId: listing.id, price: 50 }))
        .rejects.toThrow('Listing is no longer active');
      expect(prisma.offer.create).not.toHaveBeenCalled();
    });

    it('rejects offers on your own listing', async () => {
      prisma.user.findUnique.mockResolvedValue(seller);
      prisma.listing.findUnique.mockResolvedValue(listing);
      await expect(service.createOffer(seller.clerkUserId, { listingId: listing.id, price: 50 }))
        .rejects.toThrow('Cannot make an offer on your own listing');
    });

    it('rejects offers above the listing price', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.listing.findUnique.mockResolvedValue(listing);
      await expect(service.createOffer(buyer.clerkUserId, { listingId: listing.id, price: 101 }))
        .rejects.toThrow(BadRequestException);
    });

    it('rejects a second pending offer from the same buyer', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.listing.findUnique.mockResolvedValue(listing);
      prisma.offer.findFirst.mockResolvedValue(pendingOffer);
      await expect(service.createOffer(buyer.clerkUserId, { listingId: listing.id, price: 50 }))
        .rejects.toThrow('You already have a pending offer for this listing');
    });

    it('creates a pending offer and posts a chat message in a new conversation', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.listing.findUnique.mockResolvedValue(listing);
      prisma.offer.findFirst.mockResolvedValue(null);
      prisma.offer.create.mockResolvedValue({ id: 'offer-2', price: 80 });
      prisma.conversation.findFirst.mockResolvedValue(null);
      prisma.conversation.create.mockResolvedValue({ id: 'conv-1' });

      const result = await service.createOffer(buyer.clerkUserId, { listingId: listing.id, price: 80 });

      expect(result).toEqual({ id: 'offer-2', price: 80 });
      expect(prisma.offer.create).toHaveBeenCalledWith(expect.objectContaining({
        data: { price: 80, listingId: listing.id, buyerId: buyer.id, status: OfferStatus.PENDING },
      }));
      expect(chatService.createMessage).toHaveBeenCalledWith(
        buyer.clerkUserId, 'conv-1', 'I have made an offer of $80 for this item.',
      );
    });

    it('still returns the offer when the chat message fails', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.listing.findUnique.mockResolvedValue(listing);
      prisma.offer.findFirst.mockResolvedValue(null);
      prisma.offer.create.mockResolvedValue({ id: 'offer-2', price: 80 });
      prisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1' });
      chatService.createMessage.mockRejectedValue(new Error('socket down'));

      await expect(service.createOffer(buyer.clerkUserId, { listingId: listing.id, price: 80 }))
        .resolves.toEqual({ id: 'offer-2', price: 80 });
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });
  });

  describe('acceptOffer', () => {
    it('only lets the seller accept', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.offer.findUnique.mockResolvedValue(pendingOffer);
      await expect(service.acceptOffer(buyer.clerkUserId, pendingOffer.id))
        .rejects.toThrow(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFound for an unknown offer', async () => {
      prisma.user.findUnique.mockResolvedValue(seller);
      prisma.offer.findUnique.mockResolvedValue(null);
      await expect(service.acceptOffer(seller.clerkUserId, 'nope')).rejects.toThrow(NotFoundException);
    });

    it('rejects offers that are no longer pending', async () => {
      prisma.user.findUnique.mockResolvedValue(seller);
      prisma.offer.findUnique.mockResolvedValue({ ...pendingOffer, status: OfferStatus.REJECTED });
      await expect(service.acceptOffer(seller.clerkUserId, pendingOffer.id))
        .rejects.toThrow('Offer is no longer pending');
    });

    it('accepts the offer and rejects the other pending offers in one transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(seller);
      prisma.offer.findUnique.mockResolvedValue(pendingOffer);

      await expect(service.acceptOffer(seller.clerkUserId, pendingOffer.id))
        .resolves.toEqual({ success: true, message: 'Offer accepted successfully' });

      expect(prisma.tx.offer.update).toHaveBeenCalledWith({
        where: { id: pendingOffer.id },
        data: { status: OfferStatus.ACCEPTED },
      });
      expect(prisma.tx.offer.updateMany).toHaveBeenCalledWith({
        where: { listingId: listing.id, status: OfferStatus.PENDING, id: { not: pendingOffer.id } },
        data: { status: OfferStatus.REJECTED },
      });
    });
  });

  describe('rejectOffer', () => {
    it('only lets the seller reject', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.offer.findUnique.mockResolvedValue(pendingOffer);
      await expect(service.rejectOffer(buyer.clerkUserId, pendingOffer.id))
        .rejects.toThrow(ForbiddenException);
    });

    it('rejects a pending offer', async () => {
      prisma.user.findUnique.mockResolvedValue(seller);
      prisma.offer.findUnique.mockResolvedValue(pendingOffer);
      prisma.offer.update.mockResolvedValue({ ...pendingOffer, status: OfferStatus.REJECTED });

      const result = await service.rejectOffer(seller.clerkUserId, pendingOffer.id);
      expect(result.status).toBe(OfferStatus.REJECTED);
    });

    it('does not reject an already accepted offer', async () => {
      prisma.user.findUnique.mockResolvedValue(seller);
      prisma.offer.findUnique.mockResolvedValue({ ...pendingOffer, status: OfferStatus.ACCEPTED });
      await expect(service.rejectOffer(seller.clerkUserId, pendingOffer.id))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelOffer', () => {
    it('only lets the buyer cancel', async () => {
      prisma.user.findUnique.mockResolvedValue(seller);
      prisma.offer.findUnique.mockResolvedValue(pendingOffer);
      await expect(service.cancelOffer(seller.clerkUserId, pendingOffer.id))
        .rejects.toThrow(ForbiddenException);
    });

    it('cancels a pending offer', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.offer.findUnique.mockResolvedValue(pendingOffer);
      prisma.offer.update.mockResolvedValue({ ...pendingOffer, status: OfferStatus.CANCELLED });

      const result = await service.cancelOffer(buyer.clerkUserId, pendingOffer.id);
      expect(result.status).toBe(OfferStatus.CANCELLED);
    });

    it('only cancels pending offers', async () => {
      prisma.user.findUnique.mockResolvedValue(buyer);
      prisma.offer.findUnique.mockResolvedValue({ ...pendingOffer, status: OfferStatus.ACCEPTED });
      await expect(service.cancelOffer(buyer.clerkUserId, pendingOffer.id))
        .rejects.toThrow('Only pending offers can be cancelled');
    });
  });
});
