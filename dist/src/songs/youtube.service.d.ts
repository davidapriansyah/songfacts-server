import { ConfigService } from '@nestjs/config';
export declare class YoutubeService {
    private configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    findVideoId(query: string): Promise<string | null>;
    searchVideos(query: string, maxResults?: number): Promise<any[]>;
    getEmbedUrl(videoId: string): string;
    getThumbnailUrl(videoId: string): string;
    searchRelated(artist: string, genres: string[], maxResults?: number): Promise<any[]>;
}
