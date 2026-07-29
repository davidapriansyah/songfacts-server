"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.client = null;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.connect();
    }
    async connect() {
        try {
            // Simple in-memory cache fallback if Redis is not available
            this.logger.log('Redis: Using in-memory cache fallback');
            this.client = new Map();
        }
        catch (error) {
            this.logger.warn('Redis connection failed, using in-memory cache');
            this.client = new Map();
        }
    }
    async get(key) {
        try {
            if (this.client instanceof Map) {
                const item = this.client.get(key);
                if (item && item.expiry > Date.now()) {
                    return item.value;
                }
                this.client.delete(key);
                return null;
            }
            return await this.client.get(key);
        }
        catch (error) {
            this.logger.error('Redis GET error:', error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (this.client instanceof Map) {
                const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
                this.client.set(key, { value, expiry });
                return;
            }
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            this.logger.error('Redis SET error:', error);
        }
    }
    async del(key) {
        try {
            if (this.client instanceof Map) {
                this.client.delete(key);
                return;
            }
            await this.client.del(key);
        }
        catch (error) {
            this.logger.error('Redis DEL error:', error);
        }
    }
    async getJSON(key) {
        const value = await this.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    async setJSON(key, value, ttlSeconds) {
        await this.set(key, JSON.stringify(value), ttlSeconds);
    }
    async flushall() {
        try {
            if (this.client instanceof Map) {
                this.client.clear();
                return;
            }
            await this.client.flushall();
        }
        catch (error) {
            this.logger.error('Redis FLUSHALL error:', error);
        }
    }
    onModuleDestroy() {
        if (this.client && !(this.client instanceof Map)) {
            this.client.quit();
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map