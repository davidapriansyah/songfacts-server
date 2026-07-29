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
exports.BandsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bands_service_1 = require("./bands.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let BandsController = class BandsController {
    constructor(bandsService) {
        this.bandsService = bandsService;
    }
    async findByName(name) {
        return this.bandsService.findByName(name);
    }
    async getTimeline(name) {
        return this.bandsService.getTimeline(name);
    }
    async getDiscography(name) {
        return this.bandsService.getDiscography(name);
    }
};
exports.BandsController = BandsController;
__decorate([
    (0, common_1.Get)(':name'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get band by name' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Band information' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Band not found' }),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BandsController.prototype, "findByName", null);
__decorate([
    (0, common_1.Get)(':name/timeline'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get band timeline (AI-generated)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Band timeline' }),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BandsController.prototype, "getTimeline", null);
__decorate([
    (0, common_1.Get)(':name/discography'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get band discography' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Band discography' }),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BandsController.prototype, "getDiscography", null);
exports.BandsController = BandsController = __decorate([
    (0, swagger_1.ApiTags)('bands'),
    (0, common_1.Controller)('bands'),
    __metadata("design:paramtypes", [bands_service_1.BandsService])
], BandsController);
//# sourceMappingURL=bands.controller.js.map