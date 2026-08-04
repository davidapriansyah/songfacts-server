import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as http from 'http';
import * as https from 'https';
import { Response } from 'express';

const execFileAsync = promisify(execFile);

const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{5,64}$/;
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_REDIRECTS = 5;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private readonly cache = new Map<string, { url: string; expiresAt: number }>();

  async resolveStreamUrl(videoId: string): Promise<string> {
    const cached = this.cache.get(videoId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    const attempts: { label: string; args: string[] }[] = [
      { label: 'web_embedded', args: ['--extractor-args', 'youtube:player_client=web_embedded'] },
      { label: 'default', args: [] },
    ];

    let lastError: any = null;
    for (const attempt of attempts) {
      try {
        const { stdout } = await execFileAsync('yt-dlp', [
          `https://www.youtube.com/watch?v=${videoId}`,
          '-f',
          'bestaudio[ext=m4a][protocol^=http]/bestaudio[protocol^=http]/bestaudio',
          '-g',
          '--no-playlist',
          '--no-warnings',
          '--no-cache-dir',
          '-4',
          ...attempt.args,
        ], { timeout: 20000, maxBuffer: 10 * 1024 * 1024 });

        const url = stdout.trim();
        if (!url || !/^https?:\/\//.test(url)) {
          throw new Error('No playable audio URL returned');
        }

        this.cache.set(videoId, { url, expiresAt: Date.now() + CACHE_TTL_MS });
        return url;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `yt-dlp [${attempt.label}] failed for ${videoId}: ${String(error?.stderr || error?.message || error).slice(0, 300)}`,
        );
      }
    }

    const detail = String(lastError?.stderr || lastError?.message || lastError).slice(0, 300);
    this.logger.error(`yt-dlp failed for ${videoId}: ${detail}`);
    throw new InternalServerErrorException(`yt-dlp failed: ${detail}`);
  }

  private fetchWithRedirects(
    url: string,
    headers: http.OutgoingHttpHeaders,
    redirectsLeft = MAX_REDIRECTS,
  ): Promise<http.IncomingMessage> {
    return new Promise((resolve, reject) => {
      const mod = url.startsWith('https:') ? https : http;
      const req = mod.get(url, { headers }, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          const nextUrl = new URL(res.headers.location, url).toString();
          resolve(this.fetchWithRedirects(nextUrl, headers, redirectsLeft - 1));
          return;
        }
        resolve(res);
      });
      req.on('error', reject);
    });
  }

  stream(videoId: string, range: string | undefined, res: Response) {
    if (!VIDEO_ID_REGEX.test(videoId || '')) {
      throw new BadRequestException('Invalid videoId');
    }

    this.resolveStreamUrl(videoId)
      .then(async (directUrl) => {
        const headers: http.OutgoingHttpHeaders = {
          'User-Agent': UA,
          'Referer': 'https://www.youtube.com/',
        };
        if (range) headers.Range = range;

        const upstream = await this.fetchWithRedirects(directUrl, headers);

        if (upstream.statusCode && upstream.statusCode >= 400) {
          upstream.resume();
          res.status(upstream.statusCode).json({
            statusCode: upstream.statusCode,
            message: 'Upstream audio error',
          });
          return;
        }

        res.status(upstream.statusCode || 200);
        for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
          const v = upstream.headers[h];
          if (v) res.setHeader(h, v as string);
        }
        upstream.pipe(res);

        res.on('close', () => upstream.destroy());
      })
      .catch((err) => {
        this.logger.error(`Stream error for ${videoId}: ${err?.message}`);
        if (!res.headersSent) {
          res.status(500).json({ statusCode: 500, message: err?.message || 'Failed to resolve audio stream' });
        }
      });
  }
}
