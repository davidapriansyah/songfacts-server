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
const path = require("path");
const http = require("http");
const https = require("https");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
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
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
let StreamService = StreamService_1 = class StreamService {
    constructor() {
        this.logger = new common_1.Logger(StreamService_1.name);
        this.cache = new Map();
        this.fileCache = new Map();
        this.fileInflight = new Map();
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
    async ensureFfmpeg() {
        for (const candidate of ['ffmpeg', '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg']) {
            try {
                await execFileAsync(candidate, ['-version'], { timeout: 5000 });
                return candidate;
            }
            catch { }
        }
        return '';
    }
    /**
     * Download the best audio for a video with yt-dlp and remux it into a
     * progressive (non-DASH) MP4/WebM using ffmpeg so Chrome's <audio> can
     * decode it. The result is cached on disk for CACHE_TTL_MS.
     */
    async ensureRemuxedFile(videoId) {
        const hit = this.fileCache.get(videoId);
        if (hit && hit.expiresAt > Date.now() && fs.existsSync(hit.path)) {
            return hit;
        }
        const inflight = this.fileInflight.get(videoId);
        if (inflight)
            return inflight;
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
    async prepareFile(videoId) {
        const ffmpeg = await this.ensureFfmpeg();
        if (!ffmpeg) {
            throw new Error('ffmpeg not found; cannot remux audio');
        }
        fs.mkdirSync(TMP_DIR, { recursive: true });
        const src = path.join(TMP_DIR, `${videoId}.src`);
        for (const f of [src]) {
            if (fs.existsSync(f))
                fs.unlinkSync(f);
        }
        const download = async (extraArgs) => {
            await execFileAsync('yt-dlp', [
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
            ], { timeout: YTDLP_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 });
        };
        // web_embedded is the client whose data downloads actually succeed with
        // anonymous yt-dlp (default/tv/android now 403 at the download stage).
        const clientAttempts = [
            { label: 'web_embedded', args: ['--extractor-args', 'youtube:player_client=web_embedded'] },
            { label: 'default', args: [] },
            { label: 'android', args: ['--extractor-args', 'youtube:player_client=android'] },
        ];
        let lastError = null;
        for (const attempt of clientAttempts) {
            try {
                await download(attempt.args);
                lastError = null;
                break;
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`yt-dlp download (${attempt.label}) failed for ${videoId}: ${String(error?.stderr || error?.message || error).slice(0, 200)}`);
            }
        }
        if (lastError) {
            throw new Error(`yt-dlp download failed (all clients): ${String(lastError?.stderr || lastError?.message || lastError).slice(0, 200)}`);
        }
        if (!fs.existsSync(src)) {
            throw new Error('yt-dlp download produced no file');
        }
        let formatName = '';
        try {
            const probe = await execFileAsync('ffprobe', ['-v', 'error', '-show_entries', 'format=format_name', '-of', 'csv=p=0', src], { timeout: 15000 });
            formatName = String(probe.stdout || '').trim().toLowerCase();
        }
        catch { }
        const isWebm = /webm|matroska/.test(formatName);
        const out = path.join(TMP_DIR, `${videoId}.${isWebm ? 'webm' : 'mp4'}`);
        if (fs.existsSync(out))
            fs.unlinkSync(out);
        const args = ['-y', '-loglevel', 'error', '-i', src, '-vn', '-c', 'copy'];
        if (!isWebm)
            args.push('-movflags', '+faststart');
        args.push('-f', isWebm ? 'webm' : 'mp4', out);
        await execFileAsync(ffmpeg, args, { timeout: REMUX_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 });
        if (!fs.existsSync(out)) {
            throw new Error('ffmpeg remux produced no output');
        }
        try {
            fs.unlinkSync(src);
        }
        catch { }
        this.logger.log(`Remuxed ${videoId} -> ${out} (${formatName || 'unknown'})`);
        return {
            path: out,
            mime: isWebm ? 'audio/webm' : 'audio/mp4',
            expiresAt: Date.now() + CACHE_TTL_MS,
        };
    }
    serveFile(res, entry, range) {
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
        if (end < startParam)
            end = startParam;
        res.status(206);
        res.setHeader('Content-Range', `bytes ${startParam}-${end}/${total}`);
        res.setHeader('Content-Length', String(end - startParam + 1));
        const stream = fs.createReadStream(entry.path, { start: startParam, end });
        stream.pipe(res);
        res.on('close', () => stream.destroy());
    }
    async stream(videoId, range, res, debug, client) {
        this.logger.log(`[STREAM] Request received: videoId=${videoId}, range=${range || 'none'}, debug=${debug}`);
        if (!VIDEO_ID_REGEX.test(videoId || '')) {
            this.logger.warn(`[STREAM] Invalid videoId: ${videoId}`);
            throw new common_1.BadRequestException('Invalid videoId');
        }
        if (debug) {
            return this.debugFormats(videoId, res, client);
        }
        try {
            const entry = await this.ensureRemuxedFile(videoId);
            if (!res.headersSent) {
                this.serveFile(res, entry, range);
            }
        }
        catch (error) {
            // Robustness: if download/remux fails for any reason, fall back to the
            // old direct re-stream (may be a DASH fragment Chrome rejects, but it is
            // still better than an error and keeps the endpoint alive).
            this.logger.error(`[STREAM] remux failed for ${videoId}, falling back to direct: ${String(error?.message || error).slice(0, 300)}`);
            try {
                const directUrl = await this.resolveDirectUrl(videoId);
                await this.reStreamDirect(directUrl, range, res);
            }
            catch (directError) {
                this.logger.error(`[STREAM] direct fallback also failed for ${videoId}: ${String(directError?.message || directError).slice(0, 300)}`);
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
    async resolveDirectUrl(videoId) {
        const cached = this.cache.get(videoId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.url;
        }
        const cookiesPath = this.ensureCookies();
        const attempts = [];
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
        attempts.push({ label: 'tv_embedded_nocookies', args: ['--extractor-args', 'youtube:player_client=tv_embedded'] }, { label: 'default_nocookies', args: [] });
        let lastError = null;
        for (const attempt of attempts) {
            try {
                const { stdout } = await execFileAsync('yt-dlp', [
                    `https://www.youtube.com/watch?v=${videoId}`,
                    '-f',
                    'bestaudio[ext=m4a]/bestaudio[protocol^=http]/bestaudio',
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
    reStreamDirect(url, range, res) {
        return new Promise((resolve, reject) => {
            const headers = {
                'User-Agent': UA,
                'Referer': 'https://www.youtube.com/',
            };
            if (range)
                headers.Range = range;
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
                    if (v)
                        res.setHeader(h, v);
                }
                upstream.pipe(res);
                res.on('close', () => upstream.destroy());
                resolve();
            })
                .catch(reject);
        });
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
    /**
     * Resolve a direct URL for native mobile players (AVPlayer/ExoPlayer), which
     * can decode YouTube DASH fMP4 that Chrome's <audio> rejects. Returns '' if
     * resolution fails so the mobile client can fall back to the remuxed proxy.
     */
    async resolveMobileUrl(videoId) {
        try {
            return await this.resolveDirectUrl(videoId);
        }
        catch (error) {
            this.logger.warn(`[MOBILE] direct resolve failed for ${videoId}, falling back to remux proxy: ${String(error?.message || error).slice(0, 200)}`);
            return '';
        }
    }
    /**
     * Warm the remuxed file for a video and return a (unused) URL. Kept for the
     * /songs/stream-url endpoint so the client can pre-warm playback on the next
     * track while the current one is still playing.
     */
    async resolveStreamUrl(videoId) {
        await this.ensureRemuxedFile(videoId);
        return '';
    }
    async debugFormats(videoId, res, client = 'web_embedded') {
        const safe = CLIENT_WHITELIST.includes(client) ? client : 'web_embedded';
        const cookiesPath = this.ensureCookies();
        const clientArgs = safe === 'default' ? [] : ['--extractor-args', `youtube:player_client=${safe}`];
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
        if (cookiesPath)
            args.push('--cookies', cookiesPath);
        let version = 'unknown';
        try {
            const { stdout: versionOut } = await execFileAsync('yt-dlp', ['--version'], { timeout: 5000 });
            version = String(versionOut).trim();
        }
        catch { }
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
            let listFormats = null;
            try {
                const { stdout: lfOut } = await execFileAsync('yt-dlp', [
                    `https://www.youtube.com/watch?v=${videoId}`,
                    '--list-formats',
                    '--no-playlist',
                    '--no-warnings',
                    '--no-cache-dir',
                    '-4',
                    ...clientArgs,
                    ...(cookiesPath ? ['--cookies', cookiesPath] : []),
                ], { timeout: 25000, maxBuffer: 5 * 1024 * 1024 });
                listFormats = String(lfOut).slice(0, 3000);
            }
            catch (lfError) {
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
};
exports.StreamService = StreamService;
exports.StreamService = StreamService = StreamService_1 = __decorate([
    (0, common_1.Injectable)()
], StreamService);
//# sourceMappingURL=stream.service.js.map