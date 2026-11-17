export interface RedisEnv {
    REDIS_HOST?: string;
    REDIS_PORT?: string | number;
    REDIS_USERNAME?: string;
    REDIS_AUTH_TOKEN?: string;
    REDIS_TLS?: string;
}

export interface RedisSettings {
    host: string;
    port: number;
    username?: string;
    password?: string;
    tls: boolean;
}

type EnvGetter = (key: string) => string | number | undefined;

/** Reads the Redis env vars through Nest's ConfigService. */
export function readRedisSettingsFrom(get: EnvGetter): RedisSettings {
    const host = get('REDIS_HOST');
    const username = get('REDIS_USERNAME');
    const password = get('REDIS_AUTH_TOKEN');
    const tls = get('REDIS_TLS');
    return readRedisSettings({
        REDIS_HOST: typeof host === 'string' ? host : undefined,
        REDIS_PORT: get('REDIS_PORT'),
        REDIS_USERNAME: typeof username === 'string' ? username : undefined,
        REDIS_AUTH_TOKEN: typeof password === 'string' ? password : undefined,
        REDIS_TLS: typeof tls === 'string' ? tls : undefined,
    });
}

/** ElastiCache primary endpoint, AUTH token, and TLS. Local Redis stays plaintext unless REDIS_TLS=true. */
export function readRedisSettings(env: RedisEnv): RedisSettings {
    const host = env.REDIS_HOST?.trim() || 'localhost';
    const port = readPort(env.REDIS_PORT);
    const username = env.REDIS_USERNAME?.trim() || undefined;
    const password = env.REDIS_AUTH_TOKEN?.trim() || undefined;
    return { host, port, username, password, tls: readTls(host, env.REDIS_TLS) };
}

/** URL for node-redis and ioredis. `rediss` turns on TLS, which ElastiCache in-transit encryption requires. */
export function redisUrl(settings: RedisSettings): string {
    const scheme = settings.tls ? 'rediss' : 'redis';
    const auth = settings.password
        ? `${encodeURIComponent(settings.username ?? '')}:${encodeURIComponent(settings.password)}@`
        : '';
    return `${scheme}://${auth}${settings.host}:${settings.port}`;
}

/** ioredis options for BullMQ. An empty `tls` object enables TLS and uses the host for SNI. */
export function bullRedisConnection(settings: RedisSettings) {
    return {
        host: settings.host,
        port: settings.port,
        ...(settings.username ? { username: settings.username } : {}),
        ...(settings.password ? { password: settings.password } : {}),
        ...(settings.tls ? { tls: {} } : {}),
    };
}

function readPort(value: string | number | undefined): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : 6379;
}

function readTls(host: string, flag: string | undefined): boolean {
    const normalized = flag?.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
    return host.endsWith('.cache.amazonaws.com');
}
