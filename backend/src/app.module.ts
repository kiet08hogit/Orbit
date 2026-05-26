import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
// You'll import your other modules (Health, Users, etc.) here later
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ChatModule } from './modules/chat/chat.module';
import { StorageModule } from './modules/storage/storage.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PostsModule } from './modules/posts/posts.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
        }),
        ConfigModule.forRoot({
            isGlobal: true, // This allows you to use ConfigService anywhere without importing the module
        }),
        PrismaModule,
        HealthModule,
        UsersModule,
        ListingsModule,
        WebhooksModule,
        ChatModule,
        StorageModule,
        PostsModule,
        CacheModule.register({
            isGlobal: true,
            ttl: 60000, // default cache time in ms (60 seconds)
        })
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
