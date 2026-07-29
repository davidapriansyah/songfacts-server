import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../songs/gemini.service';
export declare class BandsService {
    private prisma;
    private gemini;
    constructor(prisma: PrismaService, gemini: GeminiService);
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
    getTimeline(bandName: string): Promise<{
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
    getDiscography(bandName: string): Promise<{
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
