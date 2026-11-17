import { bullRedisConnection, readRedisSettings, redisUrl } from './redis';

describe('readRedisSettings', () => {
  it('defaults to plaintext localhost Redis', () => {
    const settings = readRedisSettings({});
    expect(settings).toEqual({ host: 'localhost', port: 6379, username: undefined, password: undefined, tls: false });
    expect(redisUrl(settings)).toBe('redis://localhost:6379');
    expect(bullRedisConnection(settings)).toEqual({ host: 'localhost', port: 6379 });
  });

  it('turns on TLS and encodes the AUTH token for an ElastiCache endpoint', () => {
    const settings = readRedisSettings({
      REDIS_HOST: 'master.orbit.abc.use1.cache.amazonaws.com',
      REDIS_AUTH_TOKEN: 'p/ass word',
    });

    expect(settings.tls).toBe(true);
    expect(redisUrl(settings)).toBe(
      'rediss://:p%2Fass%20word@master.orbit.abc.use1.cache.amazonaws.com:6379',
    );
    expect(bullRedisConnection(settings)).toEqual({
      host: 'master.orbit.abc.use1.cache.amazonaws.com',
      port: 6379,
      password: 'p/ass word',
      tls: {},
    });
  });

  it('keeps an explicit REDIS_TLS=false override on an ElastiCache host', () => {
    const settings = readRedisSettings({
      REDIS_HOST: 'master.orbit.abc.use1.cache.amazonaws.com',
      REDIS_TLS: 'false',
    });
    expect(settings.tls).toBe(false);
    expect(redisUrl(settings)).toBe('redis://master.orbit.abc.use1.cache.amazonaws.com:6379');
  });

  it('includes the username when Redis ACL auth is configured', () => {
    const settings = readRedisSettings({
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6380',
      REDIS_TLS: 'true',
      REDIS_USERNAME: 'app',
      REDIS_AUTH_TOKEN: 's3cret',
    });
    expect(redisUrl(settings)).toBe('rediss://app:s3cret@localhost:6380');
    expect(bullRedisConnection(settings)).toEqual({
      host: 'localhost',
      port: 6380,
      username: 'app',
      password: 's3cret',
      tls: {},
    });
  });
});
