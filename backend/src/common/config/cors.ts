import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

/** Parses the comma-separated CORS_ORIGINS env var. Defaults to the local Next.js dev server. */
export function parseCorsOrigins(raw: string | undefined): string[] {
    const origins = (raw ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    return origins.length > 0 ? origins : ['http://localhost:3001'];
}

/** Socket.io adapter that applies the same origin allowlist as the REST API. */
export class CorsIoAdapter extends IoAdapter {
    constructor(app: INestApplicationContext, private readonly origins: string[]) {
        super(app);
    }

    createIOServer(port: number, options?: ServerOptions) {
        return super.createIOServer(port, {
            ...options,
            cors: { origin: this.origins, credentials: true },
        });
    }
}
