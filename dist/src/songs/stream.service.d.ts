import { Response } from 'express';
interface FileEntry {
    path: string;
    mime: string;
    expiresAt: number;
}
export declare class StreamService {
    private readonly logger;
    private readonly cache;
    private readonly fileCache;
    private readonly fileInflight;
    private cookiesPath;
    private ensureCookies;
    private realDebridToken;
    /**
     * Resolve a direct audio URL through Real-Debrid. Works even when the server
     * runs on a datacenter IP that YouTube blocks for yt-dlp.
     */
    private resolveViaRealDebrid;
    /** Stream a remote URL into a local file (used to fetch Real-Debrid links). */
    private downloadFromUrl;
    /** Try to fetch a video's audio via Real-Debrid. Returns false if it fails. */
    private downloadViaRealDebrid;
    private ensureFfmpeg;
    /**
     * Download the best audio for a video with yt-dlp and remux it into a
     * progressive (non-DASH) MP4/WebM using ffmpeg so Chrome's <audio> can
     * decode it. The result is cached on disk for CACHE_TTL_MS.
     */
    ensureRemuxedFile(videoId: string): Promise<FileEntry>;
    private prepareFile;
    private serveFile;
    stream(videoId: string, range: string | undefined, res: Response, debug?: boolean, client?: string): Promise<void>;
    /** Resolve a playable direct URL for a video (used by the direct fallback). */
    private resolveDirectUrl;
    private reStreamDirect;
    private fetchWithRedirects;
    /**
     * Resolve a direct URL for native mobile players (AVPlayer/ExoPlayer), which
     * can decode YouTube DASH fMP4 that Chrome's <audio> rejects. Returns '' if
     * resolution fails so the mobile client can fall back to the remuxed proxy.
     */
    resolveMobileUrl(videoId: string): Promise<string>;
    /**
     * Warm the remuxed file for a video and return a (unused) URL. Kept for the
     * /songs/stream-url endpoint so the client can pre-warm playback on the next
     * track while the current one is still playing.
     */
    resolveStreamUrl(videoId: string): Promise<string>;
    debugFormats(videoId: string, res: Response, client?: string): Promise<void>;
}
export {};
