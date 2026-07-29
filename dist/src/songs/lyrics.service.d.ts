export declare class LyricsService {
    private readonly logger;
    private readonly baseUrl;
    findLyrics(artist: string, title: string): Promise<{
        plain?: string;
        synced?: string;
    } | null>;
    findLyricsById(id: number): Promise<{
        plain?: string;
        synced?: string;
    } | null>;
}
