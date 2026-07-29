import { PrismaService } from '../prisma/prisma.service';
import { YoutubeService } from './youtube.service';
import { LyricsService } from './lyrics.service';
import { GeminiService } from './gemini.service';
export declare class SongsService {
    private prisma;
    private youtube;
    private lyrics;
    private gemini;
    private readonly logger;
    constructor(prisma: PrismaService, youtube: YoutubeService, lyrics: LyricsService, gemini: GeminiService);
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
    getRandomSong(excludeIds?: number[]): Promise<{
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
    private parseVideoTitle;
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
    getLyrics(songId: number): Promise<{
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
    getFunFacts(songId: number): Promise<any>;
    getRecommendations(songId: number, limit?: number): Promise<{
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
    updateYoutubeId(songId: number, youtubeId: string): Promise<{
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
    updateLyrics(songId: number, lyrics: string): Promise<{
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
    getGenres(): Promise<string[]>;
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
    getAiRecommendations(userId?: number): Promise<{
        source: string;
        songs: any[];
    }>;
    getYoutubeRecommendations(songId: number): Promise<any[]>;
}
