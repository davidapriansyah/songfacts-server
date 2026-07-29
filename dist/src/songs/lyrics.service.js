"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LyricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LyricsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let LyricsService = LyricsService_1 = class LyricsService {
    constructor() {
        this.logger = new common_1.Logger(LyricsService_1.name);
        this.baseUrl = 'https://lrclib.net/api';
    }
    async findLyrics(artist, title) {
        try {
            this.logger.log(`Fetching lyrics for: ${artist} - ${title}`);
            // LRCLIB requires a User-Agent header
            const headers = {
                'User-Agent': 'BeatMinds/1.0 (https://github.com/beatminds)',
            };
            // Try exact match first
            const exactResponse = await axios_1.default.get(`${this.baseUrl}/get`, {
                params: {
                    artist_name: artist,
                    track_name: title,
                },
                headers,
            });
            if (exactResponse.data) {
                const data = exactResponse.data;
                this.logger.log(`Found lyrics for: ${data.artistName} - ${data.trackName}`);
                return {
                    plain: data.plainLyrics || undefined,
                    synced: data.syncedLyrics || undefined,
                };
            }
        }
        catch (error) {
            this.logger.log('Exact match not found, trying search...');
        }
        try {
            // Try search endpoint
            const searchResponse = await axios_1.default.get(`${this.baseUrl}/search`, {
                params: {
                    q: `${artist} ${title}`,
                },
                headers: {
                    'User-Agent': 'BeatMinds/1.0 (https://github.com/beatminds)',
                },
            });
            const results = searchResponse.data;
            if (results && results.length > 0) {
                const bestMatch = results[0];
                this.logger.log(`Found lyrics via search: ${bestMatch.artistName} - ${bestMatch.trackName}`);
                return {
                    plain: bestMatch.plainLyrics || undefined,
                    synced: bestMatch.syncedLyrics || undefined,
                };
            }
        }
        catch (error) {
            this.logger.error('Search failed:', error.message);
        }
        this.logger.log('No lyrics found');
        return null;
    }
    async findLyricsById(id) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/get/${id}`, {
                headers: {
                    'User-Agent': 'BeatMinds/1.0 (https://github.com/beatminds)',
                },
            });
            const data = response.data;
            return {
                plain: data.plainLyrics || undefined,
                synced: data.syncedLyrics || undefined,
            };
        }
        catch (error) {
            this.logger.error('Fetch by ID failed:', error.message);
            return null;
        }
    }
};
exports.LyricsService = LyricsService;
exports.LyricsService = LyricsService = LyricsService_1 = __decorate([
    (0, common_1.Injectable)()
], LyricsService);
//# sourceMappingURL=lyrics.service.js.map