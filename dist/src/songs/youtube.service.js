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
var YoutubeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YoutubeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let YoutubeService = YoutubeService_1 = class YoutubeService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(YoutubeService_1.name);
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
        this.apiKey = this.configService.get('YOUTUBE_API_KEY', '');
    }
    async findVideoId(query) {
        if (!this.apiKey) {
            this.logger.warn('YouTube API key not configured');
            return null;
        }
        try {
            const searchQuery = `${query} official`;
            this.logger.log(`Searching YouTube: ${searchQuery}`);
            const response = await axios_1.default.get(`${this.baseUrl}/search`, {
                params: {
                    q: searchQuery,
                    type: 'video',
                    part: 'id',
                    maxResults: 1,
                    key: this.apiKey,
                },
            });
            const items = response.data.items;
            if (items && items.length > 0) {
                const videoId = items[0].id.videoId;
                this.logger.log(`Found YouTube video: ${videoId}`);
                return videoId;
            }
            this.logger.log('No YouTube video found');
            return null;
        }
        catch (error) {
            this.logger.error('YouTube API error:', error.message);
            return null;
        }
    }
    async searchVideos(query, maxResults = 5) {
        if (!this.apiKey) {
            return [];
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/search`, {
                params: {
                    q: query,
                    type: 'video',
                    part: 'snippet',
                    maxResults,
                    key: this.apiKey,
                },
            });
            return response.data.items || [];
        }
        catch (error) {
            this.logger.error('YouTube search error:', error.message);
            return [];
        }
    }
    getEmbedUrl(videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }
    getThumbnailUrl(videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    async searchRelated(artist, genres, maxResults = 10) {
        if (!this.apiKey)
            return [];
        const queries = [
            `${artist} official music video`,
            `${genres[0] || 'pop'} music`,
        ];
        try {
            const allResults = [];
            const seenIds = new Set();
            for (const q of queries) {
                const response = await axios_1.default.get(`${this.baseUrl}/search`, {
                    params: {
                        q: q,
                        type: 'video',
                        part: 'snippet',
                        maxResults: Math.ceil(maxResults / queries.length) + 5,
                        videoCategoryId: '10',
                        key: this.apiKey,
                    },
                });
                for (const item of response.data.items || []) {
                    if (!seenIds.has(item.id.videoId)) {
                        seenIds.add(item.id.videoId);
                        allResults.push(item);
                    }
                }
            }
            const filtered = allResults.filter((item) => {
                const title = (item.snippet?.title || '').toLowerCase();
                const blacklisted = [
                    'kumpulan', 'compilation', 'collection', 'full album',
                    'lagu', 'tembang', 'terlengkap', 'terbaru',
                    'mix', 'medley', 'mega', 'terbaik',
                ];
                return !blacklisted.some((w) => title.includes(w));
            });
            return filtered.slice(0, maxResults);
        }
        catch (error) {
            this.logger.error('YouTube related search error:', error.message);
            return [];
        }
    }
};
exports.YoutubeService = YoutubeService;
exports.YoutubeService = YoutubeService = YoutubeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], YoutubeService);
//# sourceMappingURL=youtube.service.js.map