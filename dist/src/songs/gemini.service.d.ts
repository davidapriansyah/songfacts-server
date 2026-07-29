import { ConfigService } from '@nestjs/config';
export declare class GeminiService {
    private configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    private readonly model;
    constructor(configService: ConfigService);
    generateContent(prompt: string): Promise<string>;
    generateSongFacts(artist: string, title: string): Promise<any>;
    generateBandTimeline(bandName: string): Promise<any>;
}
