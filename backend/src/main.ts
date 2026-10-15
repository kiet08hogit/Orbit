import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { CorsIoAdapter, parseCorsOrigins } from './common/config/cors';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { rawBody: true });

    // 1. Security headers. Uploaded images under /uploads are loaded cross-origin by the web app.
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

    // 2. CORS: only the web origins listed in CORS_ORIGINS (comma-separated).
    // The native mobile app sends no Origin header, so CORS does not affect it.
    const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
    app.enableCors({ origin: corsOrigins, credentials: true });
    app.useWebSocketAdapter(new CorsIoAdapter(app, corsOrigins));

    // 3. Global Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // 4. Close Prisma, Redis and BullMQ connections cleanly on SIGTERM
    app.enableShutdownHooks();

    await app.listen(Number(process.env.PORT ?? 3000));
}

bootstrap();
