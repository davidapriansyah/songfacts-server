import { PrismaService } from '../prisma/prisma.service';
export declare class FavoritesService {
    private prisma;
    constructor(prisma: PrismaService);
    findByUser(userId: number): Promise<({
        song: {
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
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        songId: number;
        userId: number;
    })[]>;
    add(userId: number, songId: number): Promise<{
        song: {
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
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        songId: number;
        userId: number;
    }>;
    remove(userId: number, songId: number): Promise<{
        message: string;
    }>;
}
