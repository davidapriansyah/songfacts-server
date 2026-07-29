import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface LrclibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumentals: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

@Injectable()
export class LyricsService {
  private readonly logger = new Logger(LyricsService.name);
  private readonly baseUrl = 'https://lrclib.net/api';

  async findLyrics(artist: string, title: string): Promise<{ plain?: string; synced?: string } | null> {
    try {
      this.logger.log(`Fetching lyrics for: ${artist} - ${title}`);

      // LRCLIB requires a User-Agent header
      const headers = {
        'User-Agent': 'BeatMinds/1.0 (https://github.com/beatminds)',
      };

      // Try exact match first
      const exactResponse = await axios.get(`${this.baseUrl}/get`, {
        params: {
          artist_name: artist,
          track_name: title,
        },
        headers,
      });

      if (exactResponse.data) {
        const data = exactResponse.data as LrclibResponse;
        this.logger.log(`Found lyrics for: ${data.artistName} - ${data.trackName}`);
        return {
          plain: data.plainLyrics || undefined,
          synced: data.syncedLyrics || undefined,
        };
      }
    } catch (error) {
      this.logger.log('Exact match not found, trying search...');
    }

    try {
      // Try search endpoint
      const searchResponse = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: `${artist} ${title}`,
        },
        headers: {
          'User-Agent': 'BeatMinds/1.0 (https://github.com/beatminds)',
        },
      });

      const results = searchResponse.data as LrclibResponse[];
      if (results && results.length > 0) {
        const bestMatch = results[0];
        this.logger.log(`Found lyrics via search: ${bestMatch.artistName} - ${bestMatch.trackName}`);
        return {
          plain: bestMatch.plainLyrics || undefined,
          synced: bestMatch.syncedLyrics || undefined,
        };
      }
    } catch (error) {
      this.logger.error('Search failed:', error.message);
    }

    this.logger.log('No lyrics found');
    return null;
  }

  async findLyricsById(id: number): Promise<{ plain?: string; synced?: string } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/get/${id}`, {
        headers: {
          'User-Agent': 'BeatMinds/1.0 (https://github.com/beatminds)',
        },
      });
      const data = response.data as LrclibResponse;

      return {
        plain: data.plainLyrics || undefined,
        synced: data.syncedLyrics || undefined,
      };
    } catch (error) {
      this.logger.error('Fetch by ID failed:', error.message);
      return null;
    }
  }
}
