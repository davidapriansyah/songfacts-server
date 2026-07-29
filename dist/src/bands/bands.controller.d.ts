import { BandsService } from './bands.service';
export declare class BandsController {
    private readonly bandsService;
    constructor(bandsService: BandsService);
    findByName(name: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        genres: string[];
        image: string | null;
        formedYear: number | null;
    }>;
    getTimeline(name: string): Promise<{
        band: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            genres: string[];
            image: string | null;
            formedYear: number | null;
        };
        timeline: any;
    }>;
    getDiscography(name: string): Promise<{
        band: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            genres: string[];
            image: string | null;
            formedYear: number | null;
        };
        songs: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            youtubeId: string | null;
            artist: string;
            album: string | null;
            albumCover: string | null;
            duration: number | null;
            genres: string[];
            lyrics: string | null;
        }[];
    }>;
}
