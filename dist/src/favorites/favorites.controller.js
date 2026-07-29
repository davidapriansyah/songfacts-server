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
exports.FavoritesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const favorites_service_1 = require("./favorites.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let FavoritesController = class FavoritesController {
    constructor(favoritesService) {
        this.favoritesService = favoritesService;
    }
    async findAll(req) {
        return this.favoritesService.findByUser(req.user.id);
    }
    async add(req, songId) {
        return this.favoritesService.add(req.user.id, songId);
    }
    async remove(req, songId) {
        return this.favoritesService.remove(req.user.id, songId);
    }
};
exports.FavoritesController = FavoritesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user favorites' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of favorite songs' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':songId'),
    (0, swagger_1.ApiOperation)({ summary: 'Add song to favorites' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Song added to favorites' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Song already in favorites' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('songId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "add", null);
__decorate([
    (0, common_1.Delete)(':songId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove song from favorites' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Song removed from favorites' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Favorite not found' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('songId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "remove", null);
exports.FavoritesController = FavoritesController = __decorate([
    (0, swagger_1.ApiTags)('favorites'),
    (0, common_1.Controller)('favorites'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [favorites_service_1.FavoritesService])
], FavoritesController);
//# sourceMappingURL=favorites.controller.js.map