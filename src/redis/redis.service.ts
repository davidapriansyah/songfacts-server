import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: any = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    this.connect();
  }

  private async connect() {
    try {
      const url = this.configService.get<string>('REDIS_URL', '');
      if (!url) throw new Error('REDIS_URL not set');

      const client = createClient({
        url,
        socket: {
          connectTimeout: 2000,
          reconnectStrategy: false,
        },
      });
      client.on('error', (err: Error) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });

      await client.connect();
      this.client = client;
      this.logger.log('Redis connected');
    } catch (error: any) {
      // Redis not reachable — fall back to an in-memory cache (resets on restart)
      this.logger.warn(`Redis connection failed (${error?.message}), using in-memory cache`);
      this.client = new Map();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.client instanceof Map) {
        const item = this.client.get(key);
        if (item && item.expiry > Date.now()) {
          return item.value;
        }
        this.client.delete(key);
        return null;
      }
      if (!this.client) return null;
      return await this.client.get(key);
    } catch (error) {
      this.logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.client instanceof Map) {
        const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
        this.client.set(key, { value, expiry });
        return;
      }
      if (!this.client) return;
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error('Redis SET error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.client instanceof Map) {
        this.client.delete(key);
        return;
      }
      if (!this.client) return;
      await this.client.del(key);
    } catch (error) {
      this.logger.error('Redis DEL error:', error);
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async flushall(): Promise<void> {
    try {
      if (this.client instanceof Map) {
        this.client.clear();
        return;
      }
      if (!this.client) return;
      await this.client.flushAll();
    } catch (error) {
      this.logger.error('Redis FLUSHALL error:', error);
    }
  }

  onModuleDestroy() {
    if (this.client && !(this.client instanceof Map)) {
      this.client.quit();
    }
  }
}