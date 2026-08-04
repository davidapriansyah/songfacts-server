"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StreamService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = require("fs");
const http = require("http");
const https = require("https");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{5,64}$/;
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_REDIRECTS = 5;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
let StreamService = StreamService_1 = class StreamService {
    constructor() {
        this.logger = new common_1.Logger(StreamService_1.name);
        this.cache = new Map();
        this.cookiesPath = null;
    }
    ensureCookies() {
        if (this.cookiesPath)
            return this.cookiesPath;
        const b64 = process.env.COOKIES_BASE64;
        if (!b64)
            return null;
        try {
            const path = '/tmp/yt_cookies.txt';
            fs.writeFileSync(path, Buffer.from(b64, 'base64').toString('utf8'), { mode: 0o600 });
            this.cookiesPath = path;
            this.logger.log('YouTube cookies loaded');
            return path;
        }
        catch (error) {
            this.logger.error(`Failed to load YouTube cookies: ${error?.message}`);
            return null;
        }
    }
    async resolveStreamUrl(videoId) {
        const cached = this.cache.get(videoId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.url;
        }
        const cookiesPath = this.ensureCookies();
        const attempts = [];
        if (cookiesPath) {
            attempts.push({
                label: 'cookies_web_embedded',
                args: ['--cookies', cookiesPath, '--extractor-args', 'youtube:player_client=web_embedded'],
            });
            attempts.push({ label: 'cookies', args: ['--cookies', cookiesPath] });
        }
        attempts.push({ label: 'web_embedded', args: ['--extractor-args', 'youtube:player_client=web_embedded'] }, { label: 'default', args: [] });
        let lastError = null;
        for (const attempt of attempts) {
            try {
                const { stdout } = await execFileAsync('yt-dlp', [
                    `https://www.youtube.com/watch?v=${videoId}`,
                    '-f',
                    'bestaudio[protocol^=http]/bestaudio',
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
                if (/\.m3u8?(\?|$)/i.test(url)) {
                    throw new Error('HLS manifest returned');
                }
                this.cache.set(videoId, { url, expiresAt: Date.now() + CACHE_TTL_MS });
                return url;
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`yt-dlp [${attempt.label}] failed for ${videoId}: ${String(error?.stderr || error?.message || error).slice(0, 300)}`);
            }
        }
        const detail = String(lastError?.stderr || lastError?.message || lastError).slice(0, 300);
        this.logger.error(`yt-dlp failed for ${videoId}: ${detail}`);
        throw new common_1.InternalServerErrorException(`yt-dlp failed: ${detail}`);
    }
    fetchWithRedirects(url, headers, redirectsLeft = MAX_REDIRECTS) {
        return new Promise((resolve, reject) => {
            const mod = url.startsWith('https:') ? https : http;
            const req = mod.get(url, { headers }, (res) => {
                if (res.statusCode &&
                    res.statusCode >= 300 &&
                    res.statusCode < 400 &&
                    res.headers.location &&
                    redirectsLeft > 0) {
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
    async debugFormats(videoId, res) {
        const cookiesPath = this.ensureCookies();
        const args = [
            `https://www.youtube.com/watch?v=${videoId}`,
            '-J',
            '--skip-download',
            '--no-playlist',
            '--no-warnings',
            '--no-cache-dir',
            '-4',
            '--extractor-args',
            'youtube:player_client=web_embedded',
        ];
        if (cookiesPath)
            args.push('--cookies', cookiesPath);
        try {
            const [{ stdout: versionOut }, { stdout }] = await Promise.all([
                execFileAsync('yt-dlp', ['--version'], { timeout: 5000 }),
                execFileAsync('yt-dlp', args, {
                    timeout: 25000,
                    maxBuffer: 30 * 1024 * 1024,
                }),
            ]);
            const j = JSON.parse(stdout);
            const formats = Array.isArray(j.formats) ? j.formats : [];
            res.json({
                ytDlpVersion: String(versionOut).trim(),
                title: j.title,
                playabilityStatus: j.playabilityStatus || null,
                formatCount: formats.length,
                formats: formats.slice(0, 20).map((f) => ({
                    format_id: f.format_id,
                    ext: f.ext,
                    acodec: f.acodec,
                    vcodec: f.vcodec,
                    protocol: f.protocol,
                    has_url: !!f.url,
                })),
            });
        }
        catch (error) {
            const detail = String(error?.stderr || error?.message || error).slice(0, 1200);
            this.logger.error(`yt-dlp debug failed for ${videoId}: ${detail}`);
            res.status(500).json({ error: detail });
        }
    }
    stream(videoId, range, res, debug) {
        if (!VIDEO_ID_REGEX.test(videoId || '')) {
            throw new common_1.BadRequestException('Invalid videoId');
        }
        if (debug) {
            return this.debugFormats(videoId, res);
        }
        this.resolveStreamUrl(videoId)
            .then(async (directUrl) => {
            const headers = {
                'User-Agent': UA,
                'Referer': 'https://www.youtube.com/',
            };
            if (range)
                headers.Range = range;
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
                if (v)
                    res.setHeader(h, v);
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
};
exports.StreamService = StreamService;
exports.StreamService = StreamService = StreamService_1 = __decorate([
    (0, common_1.Injectable)()
], StreamService);
//# sourceMappingURL=stream.service.js.map