import { Response } from 'express';
import { SongsService } from './songs.service';
import { StreamService } from './stream.service';
export declare class SongsController {
    private readonly songsService;
    private readonly streamService;
    constructor(songsService: SongsService, streamService: StreamService);
    stream(query: any, range?: string, res?: Response): Promise<void | undefined>;
    findAll(page?: number, limit?: number): Promise<{
        data: {
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
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    search(query: string, page?: number, limit?: number): Promise<{
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
        total: number;
        page: number;
        limit: number;
        source: string;
    } | {
        songs: {
            videoId: any;
            title: string;
            artist: string;
            channel: any;
            thumbnail: any;
            publishedAt: any;
        }[];
        total: number;
        page: number;
        limit: number;
        source: string;
    }>;
    getGenres(): Promise<string[]>;
    getRandomSong(exclude?: string): Promise<{
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
    } | null>;
    getByGenre(genre: string, limit?: number): Promise<{
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
    }[]>;
    getGenreFromYoutube(genre: string, limit?: number): Promise<any[]>;
    getAiRecommendations(req: any): Promise<{
        source: string;
        songs: any[];
    }>;
    getMoodPlaylist(mood: string, limit?: number): Promise<{
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
    }[]>;
    getYoutubeRecommendations(id: number): Promise<any[]>;
    findById(id: number): Promise<{
        songFact: {
            id: number;
            songId: number;
            funFacts: import("@prisma/client/runtime/library").JsonValue;
            generatedAt: Date;
        } | null;
    } & {
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
    }>;
    getLyrics(id: number): Promise<{
        lyrics: string | null;
        synced: string | null;
        cached: boolean;
        message?: undefined;
    } | {
        lyrics: null;
        synced: null;
        cached: boolean;
        message: string;
    }>;
    getFunFacts(id: number): Promise<any>;
    getRecommendations(id: number, limit?: number): Promise<{
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
    }[]>;
    saveFromYoutube(videoId: string): Promise<{
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
    }>;
    saveFromCache(videoId: string, title: string, artist: string, albumCover?: string): Promise<{
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
    }>;
    updateYoutubeId(id: number, youtubeId: string): Promise<{
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
    }>;
    updateLyrics(id: number, lyrics: string): Promise<{
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
    }>;
}
