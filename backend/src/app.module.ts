import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ChatModule } from './modules/chat/chat.module';
import { StorageModule } from './modules/storage/storage.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PostsModule } from './modules/posts/posts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { JobsModule } from './modules/jobs/jobs.module';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { ReportsModule } from './modules/reports/reports.module';
import { PaymentsModule } from './modules/payments/payments.module';

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
        TransactionsModule,
        ReportsModule,
        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const host = configService.get('REDIS_HOST', 'localhost');
                const port = configService.get('REDIS_PORT', 6379);
                return {
                    store: await redisStore({
                        url: `redis://${host}:${port}`,
                        ttl: 60000,
                    }),
                };
            },
        }),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const host = configService.get('REDIS_HOST', 'localhost');
                const port = configService.get('REDIS_PORT', 6379);
                return {
                    throttlers: [
                        {
                            ttl: 60000,
                            limit: 100,
                        },
                    ],
                    storage: new ThrottlerStorageRedisService(`redis://${host}:${port}`),
                };
            },
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    host: configService.get('REDIS_HOST', 'localhost'),
                    port: configService.get('REDIS_PORT', 6379),
                },
            }),
            inject: [ConfigService],
        }),
        JobsModule,
        PaymentsModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
