import { Controller, Get, Post, Body, UseGuards, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
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
  @UseInterceptors(CacheInterceptor)
  getAllPosts() {
    return this.postsService.getAllPosts();
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
}
