import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly model = 'gemini-3-flash-preview';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not set');
    }
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      this.logger.log(`Calling Gemini API: ${this.model}`);
      
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }],
      });
      
      this.logger.log('Gemini API response received');
      return response.data.candidates[0].content.parts[0].text;
    } catch (error: any) {
      this.logger.error('Gemini API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async generateSongFacts(artist: string, title: string) {
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
    } catch (error) {
      this.logger.error('Gemini error:', error.message);
      return {
        artist: { funfacts: ['Gagal mengambil data fun fact'] },
        song: { funfacts: ['Gagal mengambil data fun fact'] },
        lyrics_meaning: 'Gagal mengambil data',
        trivia: 'Gagal mengambil data',
      };
    }
  }

  async generateBandTimeline(bandName: string) {
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
    } catch (error) {
      this.logger.error('Gemini error:', error.message);
      return {
        band_name: bandName,
        error: 'Gagal mengambil data timeline',
      };
    }
  }
}
