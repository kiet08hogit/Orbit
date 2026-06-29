import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(clerkUserId: string, createReviewDto: CreateReviewDto) {
    const reviewer = await this.prisma.user.findUnique({ where: { clerkUserId } });
    if (!reviewer) throw new NotFoundException('Reviewer not found');
    
    if (reviewer.id === createReviewDto.revieweeId) {
      throw new BadRequestException('You cannot review yourself');
    }

    // Ensure they have chatted (they share a conversation)
    const hasChatted = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { members: { some: { userId: reviewer.id } } },
          { members: { some: { userId: createReviewDto.revieweeId } } }
        ]
      }
    });

    if (!hasChatted) {
      throw new BadRequestException('You can only leave a review for someone you have chatted with.');
    }

    // Ensure no existing review for this user pair
    const existingReview = await this.prisma.review.findFirst({
      where: {
        reviewerId: reviewer.id,
        revieweeId: createReviewDto.revieweeId
      }
    });

    if (existingReview) {
      throw new BadRequestException('You have already left a review for this user.');
    }

    return this.prisma.review.create({
      data: {
        reviewerId: reviewer.id,
        revieweeId: createReviewDto.revieweeId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, username: true, avatarUrl: true }
        }
      }
    });
  }

  async getUserReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          select: { id: true, name: true, username: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalRating = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;

    return { reviews, averageRating, totalCount: reviews.length };
  }
}
