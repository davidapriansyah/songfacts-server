import { Response } from 'express';
export declare class StreamService {
    private readonly logger;
    private readonly cache;
    private cookiesPath;
    private ensureCookies;
    resolveStreamUrl(videoId: string): Promise<string>;
    private fetchWithRedirects;
    stream(videoId: string, range: string | undefined, res: Response): void;
}
