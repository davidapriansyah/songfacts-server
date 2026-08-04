import { Response } from 'express';
export declare class StreamService {
    private readonly logger;
    private readonly cache;
    private cookiesPath;
    private ensureCookies;
    resolveStreamUrl(videoId: string): Promise<string>;
    private fetchWithRedirects;
    debugFormats(videoId: string, res: Response): Promise<void>;
    stream(videoId: string, range: string | undefined, res: Response, debug?: boolean): Promise<void> | undefined;
}
