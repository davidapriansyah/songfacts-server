import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import { Response } from 'express';
import axios from 'axios';

const execFileAsync = promisify(execFile);

const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{5,64}$/;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_REDIRECTS = 5;
const TMP_DIR = '/tmp/songfacts-files';
const YTDLP_TIMEOUT_MS = 120000;
const REMUX_TIMEOUT_MS = 120000;
const CLIENT_WHITELIST = [
  'web',
  'web_embedded',
  'web_safari',
  'web_music',
  'mweb',
  'android',
  'ios',
  'tv',
  'tv_embedded',
  'default',
];
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

interface FileEntry {
  path: string;
  mime: string;
  expiresAt: number;
}

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private readonly cache = new Map<string, { url: string; expiresAt: number }>();
  private readonly fileCache = new Map<string, FileEntry>();
  private readonly fileInflight = new Map<string, Promise<FileEntry>>();
  private cookiesPath: string | null = null;

  private ensureCookies(): string | null {
    if (this.cookiesPath) return this.cookiesPath;
    const b64 = process.env.COOKIES_BASE64;
    if (!b64) return null;
    try {
      const path = '/tmp/yt_cookies.txt';
      fs.writeFileSync(path, Buffer.from(b64, 'base64').toString('utf8'), { mode: 0o600 });
      this.cookiesPath = path;
      this.logger.log('YouTube cookies loaded');
      return path;
    } catch (error: any) {
      this.logger.error(`Failed to load YouTube cookies: ${error?.message}`);
      return null;
    }
  }

  private realDebridToken(): string | null {
    const t = process.env.REAL_DEBRID_TOKEN;
    return t && t.trim() ? t.trim() : null;
  }

  /**
   * Resolve a direct audio URL through Real-Debrid. Works even when the server
   * runs on a datacenter IP that YouTube blocks for yt-dlp.
   */
  private async resolveViaRealDebrid(videoId: string): Promise<string | null> {
    const token = this.realDebridToken();
    if (!token) return null;
    try {
      const { data } = await axios.post(
        'https://api.real-debrid.com/rest/1.0/unrestrict/link',
        `link=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 20000,
        },
      );
      const url = data?.download;
      if (typeof url === 'string' && /^https?:\/\//.test(url)) {
        this.logger.log(`[RD] resolved ${videoId} -> ${url.replace(/[?#].*$/, '')}...`);
        return url;
      }
      this.logger.warn(`[RD] unexpected response for ${videoId}`);
    } catch (error: any) {
      const status = error?.response?.status;
      const body = error?.response?.data;
      const detail = String(
        (body && (body.message || body.error)) || error?.message || error,
      ).slice(0, 300);
      this.logger.warn(
        `[RD] resolve failed for ${videoId} (${status || 'no-status'}): ${detail}${body && (body.message || body.error) ? ` BODY=${JSON.stringify(body).slice(0, 200)}` : ''}`,
      );
    }
    return null;
  }

  /** Stream a remote URL into a local file (used to fetch Real-Debrid links). */
  private async downloadFromUrl(url: string, destPath: string): Promise<void> {
    const upstream = await this.fetchWithRedirects(url, { 'User-Agent': UA });
    if (upstream.statusCode && upstream.statusCode >= 400) {
      upstream.resume();
      throw new Error(`RD download failed with HTTP ${upstream.statusCode}`);
    }
    const out = fs.createWriteStream(destPath, { flags: 'w' });
    await new Promise<void>((resolve, reject) => {
      const fail = (err: Error) => {
        out.destroy();
        reject(err);
      };
      upstream.on('error', fail);
      out.on('error', fail);
      out.on('finish', () => resolve());
      upstream.pipe(out);
    });
  }

  /** Try to fetch a video's audio via Real-Debrid. Returns false if it fails. */
  private async downloadViaRealDebrid(videoId: string, src: string): Promise<boolean> {
    const url = await this.resolveViaRealDebrid(videoId);
    if (!url) return false;
    try {
      await this.downloadFromUrl(url, src);
      return true;
    } catch (error: any) {
      this.logger.warn(
        `[RD] download failed for ${videoId}: ${String(error?.message || error).slice(0, 200)}`,
      );
      if (fs.existsSync(src)) {
        try {
          fs.unlinkSync(src);
        } catch {}
      }
      return false;
    }
  }

  private async ensureFfmpeg(): Promise<string> {
    for (const candidate of ['ffmpeg', '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg']) {
      try {
        await execFileAsync(candidate, ['-version'], { timeout: 5000 });
        return candidate;
      } catch {}
    }
    return '';
  }

  /**
   * Download the best audio for a video with yt-dlp and remux it into a
   * progressive (non-DASH) MP4/WebM using ffmpeg so Chrome's <audio> can
   * decode it. The result is cached on disk for CACHE_TTL_MS.
   */
  async ensureRemuxedFile(videoId: string): Promise<FileEntry> {
    const hit = this.fileCache.get(videoId);
    if (hit && hit.expiresAt > Date.now() && fs.existsSync(hit.path)) {
      return hit;
    }
    const inflight = this.fileInflight.get(videoId);
    if (inflight) return inflight;

    const p = this.prepareFile(videoId)
      .then((entry) => {
        this.fileCache.set(videoId, entry);
        this.fileInflight.delete(videoId);
        return entry;
      })
      .catch((err) => {
        this.fileInflight.delete(videoId);
        throw err;
      });
    this.fileInflight.set(videoId, p);
    return p;
  }

  private async prepareFile(videoId: string): Promise<FileEntry> {
    const ffmpeg = await this.ensureFfmpeg();
    if (!ffmpeg) {
      throw new Error('ffmpeg not found; cannot remux audio');
    }
    fs.mkdirSync(TMP_DIR, { recursive: true });

    const src = path.join(TMP_DIR, `${videoId}.src`);
    for (const f of [src]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    // Prefer Real-Debrid for the download (works from datacenter IPs where
    // YouTube blocks yt-dlp), then fall back to yt-dlp clients.
    const rdOk = await this.downloadViaRealDebrid(videoId, src);
    if (!rdOk) {
      const download = async (extraArgs: string[]) => {
        await execFileAsync(
          'yt-dlp',
          [
            `https://www.youtube.com/watch?v=${videoId}`,
            '-f',
            '140/bestaudio[ext=m4a]/bestaudio',
            '-o',
            src,
            '--no-playlist',
            '--no-warnings',
            '--no-cache-dir',
            '--no-progress',
            '-4',
            ...extraArgs,
          ],
          { timeout: YTDLP_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
        );
      };

      // web_embedded is the client whose data downloads actually succeed with
      // anonymous yt-dlp (default/tv/android now 403 at the download stage).
      const clientAttempts: { label: string; args: string[] }[] = [
        { label: 'web_embedded', args: ['--extractor-args', 'youtube:player_client=web_embedded'] },
        { label: 'default', args: [] },
        { label: 'android', args: ['--extractor-args', 'youtube:player_client=android'] },
      ];
      let lastError: any = null;
      for (const attempt of clientAttempts) {
        try {
          await download(attempt.args);
          lastError = null;
          break;
        } catch (error: any) {
          lastError = error;
          this.logger.warn(
            `yt-dlp download (${attempt.label}) failed for ${videoId}: ${String(error?.stderr || error?.message || error).slice(0, 200)}`,
          );
        }
      }
      if (lastError) {
        throw new Error(
          `yt-dlp download failed (all clients): ${String(lastError?.stderr || lastError?.message || lastError).slice(0, 200)}`,
        );
      }
    }

    if (!fs.existsSync(src)) {
      throw new Error('audio download produced no file');
    }

    let formatName = '';
    try {
      const probe = await execFileAsync(
        'ffprobe',
        ['-v', 'error', '-show_entries', 'format=format_name', '-of', 'csv=p=0', src],
        { timeout: 15000 },
      );
      formatName = String(probe.stdout || '').trim().toLowerCase();
    } catch {}

    const isWebm = /webm|matroska/.test(formatName);
    const out = path.join(TMP_DIR, `${videoId}.${isWebm ? 'webm' : 'mp4'}`);
    if (fs.existsSync(out)) fs.unlinkSync(out);

    const args = ['-y', '-loglevel', 'error', '-i', src, '-vn', '-c', 'copy'];
    if (!isWebm) args.push('-movflags', '+faststart');
    args.push('-f', isWebm ? 'webm' : 'mp4', out);

    await execFileAsync(ffmpeg, args, { timeout: REMUX_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 });

    if (!fs.existsSync(out)) {
      throw new Error('ffmpeg remux produced no output');
    }

    try {
      fs.unlinkSync(src);
    } catch {}

    this.logger.log(`Remuxed ${videoId} -> ${out} (${formatName || 'unknown'})`);
    return {
      path: out,
      mime: isWebm ? 'audio/webm' : 'audio/mp4',
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
  }

  private serveFile(res: Response, entry: FileEntry, range: string | undefined) {
    const stat = fs.statSync(entry.path);
    const total = stat.size;
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', entry.mime);

    if (res.req?.method === 'HEAD') {
      res.setHeader('Content-Length', String(total));
      res.status(200);
      return res.end();
    }

    if (!range) {
      res.setHeader('Content-Length', String(total));
      res.status(200);
      const stream = fs.createReadStream(entry.path);
      stream.pipe(res);
      res.on('close', () => stream.destroy());
      return;
    }

    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (!m) {
      res.status(416).end();
      return;
    }
    const startParam = m[1] === '' ? undefined : parseInt(m[1], 10);
    const endParam = m[2] === '' ? undefined : parseInt(m[2], 10);

    if (startParam === undefined) {
      const suffix = endParam ?? 0;
      const s = Math.max(total - suffix, 0);
      const e = total - 1;
      if (e < 0) {
        res.status(416).setHeader('Content-Range', `bytes */0`).end();
        return;
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${s}-${e}/${total}`);
      res.setHeader('Content-Length', String(e - s + 1));
      fs.createReadStream(entry.path, { start: s, end: e }).pipe(res);
      return;
    }

    if (startParam >= total) {
      res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
      return;
    }
    let end = endParam === undefined || endParam >= total ? total - 1 : endParam;
    if (end < startParam) end = startParam;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${startParam}-${end}/${total}`);
    res.setHeader('Content-Length', String(end - startParam + 1));
    const stream = fs.createReadStream(entry.path, { start: startParam, end });
    stream.pipe(res);
    res.on('close', () => stream.destroy());
  }

  async stream(
    videoId: string,
    range: string | undefined,
    res: Response,
    debug?: boolean,
    client?: string,
  ) {
    this.logger.log(
      `[STREAM] Request received: videoId=${videoId}, range=${range || 'none'}, debug=${debug}`,
    );

    if (!VIDEO_ID_REGEX.test(videoId || '')) {
      this.logger.warn(`[STREAM] Invalid videoId: ${videoId}`);
      throw new BadRequestException('Invalid videoId');
    }

    if (debug) {
      return this.debugFormats(videoId, res, client);
    }

    try {
      const entry = await this.ensureRemuxedFile(videoId);
      if (!res.headersSent) {
        this.serveFile(res, entry, range);
      }
    } catch (error: any) {
      // Robustness: if download/remux fails for any reason, fall back to the
      // old direct re-stream (may be a DASH fragment Chrome rejects, but it is
      // still better than an error and keeps the endpoint alive).
      this.logger.error(
        `[STREAM] remux failed for ${videoId}, falling back to direct: ${String(error?.message || error).slice(0, 300)}`,
      );
      try {
        const directUrl = await this.resolveDirectUrl(videoId);
        await this.reStreamDirect(directUrl, range, res);
      } catch (directError: any) {
        this.logger.error(
          `[STREAM] direct fallback also failed for ${videoId}: ${String(directError?.message || directError).slice(0, 300)}`,
        );
        if (!res.headersSent) {
          res.status(500).json({
            statusCode: 500,
            message: 'Audio stream unavailable',
          });
        }
      }
    }
  }

  /** Resolve a playable direct URL for a video (used by the direct fallback). */
  private async resolveDirectUrl(videoId: string): Promise<string> {
    const cached = this.cache.get(videoId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    // Real-Debrid first: bypasses the YouTube datacenter IP block.
    const rdUrl = await this.resolveViaRealDebrid(videoId);
    if (rdUrl) {
      this.cache.set(videoId, { url: rdUrl, expiresAt: Date.now() + CACHE_TTL_MS });
      return rdUrl;
    }

    const cookiesPath = this.ensureCookies();
    const attempts: { label: string; args: string[] }[] = [];
    if (cookiesPath) {
      attempts.push({
        label: 'tv_embedded',
        args: ['--cookies', cookiesPath, '--extractor-args', 'youtube:player_client=tv_embedded'],
      });
      attempts.push({ label: 'default', args: ['--cookies', cookiesPath] });
      attempts.push({
        label: 'web_embedded',
        args: ['--cookies', cookiesPath, '--extractor-args', 'youtube:player_client=web_embedded'],
      });
    }
    attempts.push(
      { label: 'tv_embedded_nocookies', args: ['--extractor-args', 'youtube:player_client=tv_embedded'] },
      { label: 'default_nocookies', args: [] },
    );

    let lastError: any = null;
    for (const attempt of attempts) {
      try {
        const { stdout } = await execFileAsync(
          'yt-dlp',
          [
            `https://www.youtube.com/watch?v=${videoId}`,
            '-f',
            'bestaudio[ext=m4a]/bestaudio[protocol^=http]/bestaudio',
            '-g',
            '--no-playlist',
            '--no-warnings',
            '--no-cache-dir',
            '-4',
            ...attempt.args,
          ],
          { timeout: 20000, maxBuffer: 10 * 1024 * 1024 },
        );

        const url = stdout.trim();
        if (!url || !/^https?:\/\//.test(url)) {
          throw new Error('No playable audio URL returned');
        }
        if (/\.m3u8?(\?|$)/i.test(url)) {
          throw new Error('HLS manifest returned');
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

  private reStreamDirect(url: string, range: string | undefined, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      const headers: http.OutgoingHttpHeaders = {
        'User-Agent': UA,
        'Referer': 'https://www.youtube.com/',
      };
      if (range) headers.Range = range;

      this.fetchWithRedirects(url, headers)
        .then((upstream) => {
          if (upstream.statusCode && upstream.statusCode >= 400) {
            upstream.resume();
            reject(new Error(`Upstream audio error: ${upstream.statusCode}`));
            return;
          }
          res.status(upstream.statusCode || 200);
          for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
            const v = upstream.headers[h];
            if (v) res.setHeader(h, v as string);
          }
          upstream.pipe(res);
          res.on('close', () => upstream.destroy());
          resolve();
        })
        .catch(reject);
    });
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

  /**
   * Resolve a direct URL for native mobile players (AVPlayer/ExoPlayer), which
   * can decode YouTube DASH fMP4 that Chrome's <audio> rejects. Returns '' if
   * resolution fails so the mobile client can fall back to the remuxed proxy.
   */
  async resolveMobileUrl(videoId: string): Promise<string> {
    try {
      return await this.resolveDirectUrl(videoId);
    } catch (error: any) {
      this.logger.warn(
        `[MOBILE] direct resolve failed for ${videoId}, falling back to remux proxy: ${String(error?.message || error).slice(0, 200)}`,
      );
      return '';
    }
  }

  /**
   * Warm the remuxed file for a video and return a (unused) URL. Kept for the
   * /songs/stream-url endpoint so the client can pre-warm playback on the next
   * track while the current one is still playing.
   */
  async resolveStreamUrl(videoId: string): Promise<string> {
    await this.ensureRemuxedFile(videoId);
    return '';
  }

  async debugFormats(videoId: string, res: Response, client = 'web_embedded') {
    const safe = CLIENT_WHITELIST.includes(client) ? client : 'web_embedded';
    const cookiesPath = this.ensureCookies();
    const clientArgs =
      safe === 'default' ? [] : ['--extractor-args', `youtube:player_client=${safe}`];
    const args = [
      `https://www.youtube.com/watch?v=${videoId}`,
      '-J',
      '--skip-download',
      '--no-playlist',
      '--no-warnings',
      '--no-cache-dir',
      '-4',
      ...clientArgs,
    ];
    if (cookiesPath) args.push('--cookies', cookiesPath);

    let version = 'unknown';
    try {
      const { stdout: versionOut } = await execFileAsync('yt-dlp', ['--version'], { timeout: 5000 });
      version = String(versionOut).trim();
    } catch {}

    try {
      const { stdout } = await execFileAsync('yt-dlp', args, {
        timeout: 25000,
        maxBuffer: 30 * 1024 * 1024,
      });
      const j = JSON.parse(stdout);
      const formats = Array.isArray(j.formats) ? j.formats : [];
      res.json({
        ytDlpVersion: version,
        client: safe,
        title: j.title,
        playabilityStatus: j.playabilityStatus || null,
        formatCount: formats.length,
        formats: formats.slice(0, 20).map((f: any) => ({
          format_id: f.format_id,
          ext: f.ext,
          acodec: f.acodec,
          vcodec: f.vcodec,
          protocol: f.protocol,
          has_url: !!f.url,
        })),
      });
    } catch (error: any) {
      const detail = String(error?.stderr || error?.message || error).slice(0, 1200);
      let listFormats: string | null = null;
      try {
        const { stdout: lfOut } = await execFileAsync(
          'yt-dlp',
          [
            `https://www.youtube.com/watch?v=${videoId}`,
            '--list-formats',
            '--no-playlist',
            '--no-warnings',
            '--no-cache-dir',
            '-4',
            ...clientArgs,
            ...(cookiesPath ? ['--cookies', cookiesPath] : []),
          ],
          { timeout: 25000, maxBuffer: 5 * 1024 * 1024 },
        );
        listFormats = String(lfOut).slice(0, 3000);
      } catch (lfError: any) {
        listFormats = `ERROR: ${String(lfError?.stderr || lfError?.message || lfError).slice(0, 1000)}`;
      }
      this.logger.error(`yt-dlp debug failed for ${videoId} (client=${safe}): ${detail}`);
      res.status(500).json({
        ytDlpVersion: version,
        client: safe,
        error: detail,
        listFormats,
      });
    }
  }
}