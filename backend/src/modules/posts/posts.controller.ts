import { Controller, Get, Post, Delete, Body, UseGuards, Req, UseInterceptors, UploadedFiles, Param, Query } from '@nestjs/common';
import { PostType } from '@prisma/client';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  async getAllPosts(@Req() req, @Query('type') type?: PostType) {
    const clerkUserId = req.user.clerkUserId;
    const posts = await this.postsService.getAllPosts(clerkUserId, type);
    const ids = posts.map(p => p.id);
    const dups = ids.filter((item, index) => ids.indexOf(item) !== index);
    if (dups.length > 0) {
      console.error("DUPLICATE POSTS DETECTED IN GETALLPOSTS:", dups);
    }
    return posts;
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 4))
  createPost(
    @Req() req, 
    @Body() createPostDto: CreatePostDto,
    @UploadedFiles() files: any[]
  ) {
    const clerkUserId = req.user.clerkUserId;
    return this.postsService.createPost(clerkUserId, createPostDto, files);
  }

  @Post(':id/like')
  @UseGuards(ClerkAuthGuard)
  toggleLike(@Req() req, @Param('id') id: string) {
    const clerkUserId = req.user.clerkUserId;
    return this.postsService.toggleLike(clerkUserId, id);
  }

  @Post(':id/comment')
  @UseGuards(ClerkAuthGuard)
  createComment(@Req() req, @Param('id') id: string, @Body('content') content: string) {
    const clerkUserId = req.user.clerkUserId;
    return this.postsService.createComment(clerkUserId, id, content);
  }

  @Get(':id/comments')
  @UseGuards(ClerkAuthGuard)
  getComments(@Param('id') id: string) {
    return this.postsService.getComments(id);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  deletePost(@Req() req, @Param('id') id: string) {
    const clerkUserId = req.user.clerkUserId;
    return this.postsService.deletePost(clerkUserId, id);
  }
}
