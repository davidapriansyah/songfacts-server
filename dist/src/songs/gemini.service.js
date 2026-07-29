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
var GeminiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let GeminiService = GeminiService_1 = class GeminiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GeminiService_1.name);
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.model = 'gemini-3-flash-preview';
        this.apiKey = this.configService.get('GEMINI_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('GEMINI_API_KEY not set');
        }
    }
    async generateContent(prompt) {
        try {
            const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
            this.logger.log(`Calling Gemini API: ${this.model}`);
            const response = await axios_1.default.post(url, {
                contents: [{ parts: [{ text: prompt }] }],
            });
            this.logger.log('Gemini API response received');
            return response.data.candidates[0].content.parts[0].text;
        }
        catch (error) {
            this.logger.error('Gemini API error:', error.response?.data || error.message);
            throw error;
        }
    }
    async generateSongFacts(artist, title) {
        if (!this.apiKey) {
            return {
                artist: { funfacts: ['Gemini API belum dikonfigurasi'] },
                song: { funfacts: ['Gemini API belum dikonfigurasi'] },
                lyrics_meaning: 'Gemini API belum dikonfigurasi',
                trivia: 'Gemini API belum dikonfigurasi',
            };
        }
        try {
            this.logger.log(`Generating fun facts for: ${artist} - ${title}`);
            const prompt = `
        Tolong berikan fun fact lengkap tentang band/artist "${artist}" dan lagu "${title}" dalam format JSON sebagai berikut:
        
        {
          "artist": {
            "funfacts": [
              "Fun fact 1 tentang artist",
              "Fun fact 2 tentang artist",
              "Fun fact 3 tentang artist"
            ]
          },
          "song": {
            "funfacts": [
              "Fun fact 1 tentang lagu",
              "Fun fact 2 tentang lagu",
              "Fun fact 3 tentang lagu"
            ]
          },
          "lyrics_meaning": "Penjelasan singkat tentang makna lagu",
          "trivia": "Trivia menarik tentang lagu ini"
        }
        
        Berikan dalam bahasa Indonesia. Pastikan JSON valid tanpa markdown tags.
      `;
            const text = await this.generateContent(prompt);
            const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedText);
        }
        catch (error) {
            this.logger.error('Gemini error:', error.message);
            return {
                artist: { funfacts: ['Gagal mengambil data fun fact'] },
                song: { funfacts: ['Gagal mengambil data fun fact'] },
                lyrics_meaning: 'Gagal mengambil data',
                trivia: 'Gagal mengambil data',
            };
        }
    }
    async generateBandTimeline(bandName) {
        if (!this.apiKey) {
            return {
                band_name: bandName,
                error: 'Gemini API belum dikonfigurasi',
            };
        }
        try {
            this.logger.log(`Generating timeline for: ${bandName}`);
            const prompt = `
        Tolong berikan timeline sejarah lengkap tentang band "${bandName}" dalam format JSON sebagai berikut:
        
        {
          "band_name": "Nama Band",
          "formed_year": 1990,
          "genre": ["Genre 1", "Genre 2"],
          "members": [
            {
              "name": "Nama Member",
              "role": "Vocalist/Guitarist/etc",
              "years_active": "1990-sekarang"
            }
          ],
          "timeline": [
            {
              "year": 1990,
              "event": "Band dibentuk"
            },
            {
              "year": 1995,
              "event": "Album pertama dirilis"
            }
          ],
          "discography": [
            {
              "year": 1995,
              "album": "Nama Album",
              "hits": ["Lagu Hit 1", "Lagu Hit 2"]
            }
          ],
          "achievements": [
            "Pencapaian 1",
            "Pencapaian 2"
          ],
          "fun_facts": [
            "Fun fact 1",
            "Fun fact 2"
          ]
        }
        
        Berikan dalam bahasa Indonesia. Pastikan JSON valid tanpa markdown tags.
      `;
            const text = await this.generateContent(prompt);
            const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedText);
        }
        catch (error) {
            this.logger.error('Gemini error:', error.message);
            return {
                band_name: bandName,
                error: 'Gagal mengambil data timeline',
            };
        }
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = GeminiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiService);
//# sourceMappingURL=gemini.service.js.map