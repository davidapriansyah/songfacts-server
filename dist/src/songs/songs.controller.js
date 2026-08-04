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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SongsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const songs_service_1 = require("./songs.service");
const stream_service_1 = require("./stream.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let SongsController = class SongsController {
    constructor(songsService, streamService) {
        this.songsService = songsService;
        this.streamService = streamService;
    }
    async stream(query, range, res) {
        if (!res)
            throw new common_1.BadRequestException('No response');
        return this.streamService.stream(String(query.videoId || ''), range, res);
    }
    async findAll(page, limit) {
        return this.songsService.findAll(page || 1, limit || 20);
    }
    async search(query, page, limit) {
        return this.songsService.search(query, page || 1, limit || 12);
    }
    async getGenres() {
        return this.songsService.getGenres();
    }
    async getRandomSong(exclude) {
        const excludeIds = exclude ? exclude.split(',').map(Number) : [];
        return this.songsService.getRandomSong(excludeIds);
    }
    async getByGenre(genre, limit) {
        return this.songsService.getByGenre(genre, limit || 50);
    }
    async getGenreFromYoutube(genre, limit) {
        return this.songsService.getGenreFromYoutube(genre, limit || 20);
    }
    async getAiRecommendations(req) {
        return this.songsService.getAiRecommendations(req.user?.id);
    }
    async getMoodPlaylist(mood, limit) {
        return this.songsService.getMoodPlaylist(mood, limit || 20);
    }
    async getYoutubeRecommendations(id) {
        return this.songsService.getYoutubeRecommendations(id);
    }
    async findById(id) {
        return this.songsService.findById(id);
    }
    async getLyrics(id) {
        return this.songsService.getLyrics(id);
    }
    async getFunFacts(id) {
        return this.songsService.getFunFacts(id);
    }
    async getRecommendations(id, limit) {
        return this.songsService.getRecommendations(id, limit || 10);
    }
    async saveFromYoutube(videoId) {
        return this.songsService.saveFromYoutube(videoId);
    }
    async saveFromCache(videoId, title, artist, albumCover) {
        return this.songsService.saveFromCache(videoId, title, artist, albumCover);
    }
    async updateYoutubeId(id, youtubeId) {
        return this.songsService.updateYoutubeId(id, youtubeId);
    }
    async updateLyrics(id, lyrics) {
        return this.songsService.updateLyrics(id, lyrics);
    }
};
exports.SongsController = SongsController;
__decorate([
    (0, common_1.Get)('stream'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Stream audio for a YouTube video (proxied from YouTube)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)('range')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "stream", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all songs' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search songs' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('genres'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available genres' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getGenres", null);
__decorate([
    (0, common_1.Get)('random'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a random song from database' }),
    __param(0, (0, common_1.Query)('exclude')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getRandomSong", null);
__decorate([
    (0, common_1.Get)('genre/:genre'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get songs by genre' }),
    __param(0, (0, common_1.Param)('genre')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getByGenre", null);
__decorate([
    (0, common_1.Get)('genre/:genre/youtube'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get songs by genre from YouTube' }),
    __param(0, (0, common_1.Param)('genre')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getGenreFromYoutube", null);
__decorate([
    (0, common_1.Get)('recommendations/ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI-powered song recommendations' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getAiRecommendations", null);
__decorate([
    (0, common_1.Get)('mood/:mood'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get songs by mood' }),
    __param(0, (0, common_1.Param)('mood')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getMoodPlaylist", null);
__decorate([
    (0, common_1.Get)(':id/youtube-recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get YouTube related songs for a song' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getYoutubeRecommendations", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get song by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/lyrics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get lyrics for a song' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getLyrics", null);
__decorate([
    (0, common_1.Get)(':id/funfacts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get fun facts for a song' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getFunFacts", null);
__decorate([
    (0, common_1.Get)(':id/recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get similar song recommendations' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Post)('save'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Save a YouTube song to database' }),
    __param(0, (0, common_1.Body)('videoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "saveFromYoutube", null);
__decorate([
    (0, common_1.Post)('save-from-cache'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Save a song from cached recommendation data (no YouTube API call)' }),
    __param(0, (0, common_1.Body)('videoId')),
    __param(1, (0, common_1.Body)('title')),
    __param(2, (0, common_1.Body)('artist')),
    __param(3, (0, common_1.Body)('albumCover')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "saveFromCache", null);
__decorate([
    (0, common_1.Put)(':id/youtube'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update YouTube video ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('youtubeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "updateYoutubeId", null);
__decorate([
    (0, common_1.Put)(':id/lyrics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update lyrics' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('lyrics')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], SongsController.prototype, "updateLyrics", null);
exports.SongsController = SongsController = __decorate([
    (0, swagger_1.ApiTags)('songs'),
    (0, common_1.Controller)('songs'),
    __metadata("design:paramtypes", [songs_service_1.SongsService,
        stream_service_1.StreamService])
], SongsController);
//# sourceMappingURL=songs.controller.js.map