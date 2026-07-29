import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    findAll(req: any): Promise<({
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
    add(req: any, songId: number): Promise<{
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
    remove(req: any, songId: number): Promise<{
        message: string;
    }>;
}
