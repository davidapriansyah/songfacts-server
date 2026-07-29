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
exports.RoomController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const room_service_1 = require("./room.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let RoomController = class RoomController {
    constructor(roomService) {
        this.roomService = roomService;
    }
    async createRoom(req, name) {
        return this.roomService.createRoom(req.user.id, name);
    }
    async getRoom(code, req) {
        return this.roomService.getRoom(code, req.user.id);
    }
    async joinRoom(code, req) {
        return this.roomService.joinRoom(code, req.user.id);
    }
    async leaveRoom(code, req) {
        return this.roomService.leaveRoom(code, req.user.id);
    }
    async kickMember(code, targetId, req) {
        return this.roomService.kickMember(code, req.user.id, targetId);
    }
    async playSong(code, req, songData) {
        return this.roomService.playSong(code, req.user.id, songData);
    }
    async updatePlayback(code, req, data) {
        return this.roomService.updatePlayback(code, req.user.id, data);
    }
    async addToQueue(code, req, songData) {
        return this.roomService.addToQueue(code, req.user.id, songData);
    }
    async removeFromQueue(code, queueId, req) {
        return this.roomService.removeFromQueue(code, req.user.id, queueId);
    }
    async clearQueue(code, req) {
        return this.roomService.clearQueue(code, req.user.id);
    }
    async reorderQueue(code, req, queueIds) {
        return this.roomService.reorderQueue(code, req.user.id, queueIds);
    }
    async playNext(code, req) {
        return this.roomService.playNext(code, req.user.id);
    }
    async searchSongs(code, query, req) {
        return this.roomService.searchSongs(code, req.user.id, query);
    }
};
exports.RoomController = RoomController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new room' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Room created successfully' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Get)(':code'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get room info by code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Room info retrieved' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "getRoom", null);
__decorate([
    (0, common_1.Post)(':code/join'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Join a room' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Joined room successfully' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "joinRoom", null);
__decorate([
    (0, common_1.Post)(':code/leave'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Leave a room' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Left room' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "leaveRoom", null);
__decorate([
    (0, common_1.Post)(':code/kick/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Kick a member (leader only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Member kicked' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "kickMember", null);
__decorate([
    (0, common_1.Put)(':code/play'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Play a song (leader only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Song is now playing' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "playSong", null);
__decorate([
    (0, common_1.Put)(':code/playback'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update playback state (leader only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Playback updated' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "updatePlayback", null);
__decorate([
    (0, common_1.Post)(':code/queue'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add song to queue (leader only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Song added to queue' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "addToQueue", null);
__decorate([
    (0, common_1.Delete)(':code/queue/:queueId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove song from queue (leader only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Song removed from queue' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Param)('queueId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "removeFromQueue", null);
__decorate([
    (0, common_1.Delete)(':code/queue'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all queue (leader only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Queue cleared' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "clearQueue", null);
__decorate([
    (0, common_1.Put)(':code/queue/reorder'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder queue (leader only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Queue reordered' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)('queueIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Array]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "reorderQueue", null);
__decorate([
    (0, common_1.Post)(':code/queue/next'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Play next song from queue (leader only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Playing next song' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "playNext", null);
__decorate([
    (0, common_1.Get)(':code/search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search songs for room (DB + YouTube)' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], RoomController.prototype, "searchSongs", null);
exports.RoomController = RoomController = __decorate([
    (0, swagger_1.ApiTags)('rooms'),
    (0, common_1.Controller)('rooms'),
    __metadata("design:paramtypes", [room_service_1.RoomService])
], RoomController);
//# sourceMappingURL=room.controller.js.map