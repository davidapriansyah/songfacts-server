import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleDestroy {
    private configService;
    private client;
    private readonly logger;
    constructor(configService: ConfigService);
    private connect;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    getJSON<T>(key: string): Promise<T | null>;
    setJSON(key: string, value: any, ttlSeconds?: number): Promise<void>;
    flushall(): Promise<void>;
    onModuleDestroy(): void;
}
