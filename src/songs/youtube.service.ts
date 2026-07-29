import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY', '');
  }

  async findVideoId(query: string): Promise<string | null> {
    if (!this.apiKey) {
      this.logger.warn('YouTube API key not configured');
      return null;
    }

    try {
      const searchQuery = `${query} official`;
      this.logger.log(`Searching YouTube: ${searchQuery}`);

      const response = await axios.get(`${this.baseUrl}/search`, {
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
    } catch (error) {
      this.logger.error('YouTube API error:', error.message);
      return null;
    }
  }

  async searchVideos(query: string, maxResults = 5): Promise<any[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: query,
          type: 'video',
          part: 'snippet',
          maxResults,
          key: this.apiKey,
        },
      });

      return response.data.items || [];
    } catch (error) {
      this.logger.error('YouTube search error:', error.message);
      return [];
    }
  }

  getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  getThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  async searchRelated(artist: string, genres: string[], maxResults = 10): Promise<any[]> {
    if (!this.apiKey) return [];

    const queries = [
      `${artist} official music video`,
      `${genres[0] || 'pop'} music`,
    ];

    try {
      const allResults: any[] = [];
      const seenIds = new Set<string>();

      for (const q of queries) {
        const response = await axios.get(`${this.baseUrl}/search`, {
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
    } catch (error) {
      this.logger.error('YouTube related search error:', error.message);
      return [];
    }
  }
}
