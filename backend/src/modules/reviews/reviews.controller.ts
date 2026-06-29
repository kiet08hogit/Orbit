import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  createReview(@Req() req, @Body() createReviewDto: CreateReviewDto) {
    const clerkUserId = req.user.clerkUserId;
    return this.reviewsService.createReview(clerkUserId, createReviewDto);
  }

  @Get('user/:id')
  getUserReviews(@Param('id') userId: string) {
    return this.reviewsService.getUserReviews(userId);
  }
}
