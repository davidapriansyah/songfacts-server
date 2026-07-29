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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BandsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const gemini_service_1 = require("../songs/gemini.service");
let BandsService = class BandsService {
    constructor(prisma, gemini) {
        this.prisma = prisma;
        this.gemini = gemini;
    }
    async findByName(name) {
        let band = await this.prisma.band.findFirst({
            where: { name: { contains: name, mode: 'insensitive' } },
        });
        if (!band) {
            const song = await this.prisma.song.findFirst({
                where: { artist: { contains: name, mode: 'insensitive' } },
            });
            if (song) {
                band = await this.prisma.band.create({
                    data: {
                        name: song.artist,
                        image: song.albumCover,
                        genres: song.genres,
                    },
                });
            }
        }
        if (!band) {
            throw new common_1.NotFoundException('Band not found');
        }
        return band;
    }
    async getTimeline(bandName) {
        const band = await this.findByName(bandName);
        const timeline = await this.gemini.generateBandTimeline(band.name);
        return { band, timeline };
    }
    async getDiscography(bandName) {
        const band = await this.findByName(bandName);
        const songs = await this.prisma.song.findMany({
            where: { artist: { contains: band.name, mode: 'insensitive' } },
            orderBy: { createdAt: 'asc' },
        });
        return { band, songs };
    }
};
exports.BandsService = BandsService;
exports.BandsService = BandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        gemini_service_1.GeminiService])
], BandsService);
//# sourceMappingURL=bands.service.js.map