import { PrismaService } from '../prisma/prisma.service';
import { YoutubeService } from '../songs/youtube.service';
import { RoomGateway } from './room.gateway';
export declare class RoomService {
    private prisma;
    private youtube;
    private gateway;
    private readonly logger;
    constructor(prisma: PrismaService, youtube: YoutubeService, gateway: RoomGateway);
    generateRoomCode(): string;
    createRoom(userId: number, name: string): Promise<{
        isLeader: boolean;
        isMember: boolean;
        role: string;
        leader: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        currentSong: {
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
        } | null;
        members: ({
            user: {
                id: number;
                email: string;
                profileImage: string | null;
            };
        } & {
            id: string;
            userId: number;
            roomId: string;
            role: string;
            joinedAt: Date;
        })[];
        queue: {
            id: string;
            createdAt: Date;
            title: string;
            artist: string | null;
            duration: string | null;
            songId: number | null;
            position: number;
            roomId: string;
            youtubeVideoId: string | null;
            thumbnail: string | null;
            addedById: number;
        }[];
        id: string;
        createdAt: Date;
        name: string;
        code: string;
        leaderId: number;
        currentSongId: number | null;
        currentSongYoutubeId: string | null;
        currentSongTitle: string | null;
        currentSongArtist: string | null;
        currentSongThumbnail: string | null;
        currentTime: number;
        isPlaying: boolean;
        lastActivityAt: Date;
    } | {
        isLeader: boolean;
        leader: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        members: ({
            user: {
                id: number;
                email: string;
                profileImage: string | null;
            };
        } & {
            id: string;
            userId: number;
            roomId: string;
            role: string;
            joinedAt: Date;
        })[];
        queue: {
            id: string;
            createdAt: Date;
            title: string;
            artist: string | null;
            duration: string | null;
            songId: number | null;
            position: number;
            roomId: string;
            youtubeVideoId: string | null;
            thumbnail: string | null;
            addedById: number;
        }[];
        id: string;
        createdAt: Date;
        name: string;
        code: string;
        leaderId: number;
        currentSongId: number | null;
        currentSongYoutubeId: string | null;
        currentSongTitle: string | null;
        currentSongArtist: string | null;
        currentSongThumbnail: string | null;
        currentTime: number;
        isPlaying: boolean;
        lastActivityAt: Date;
    }>;
    getRoom(code: string, userId: number): Promise<{
        currentSong: {
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
        } | {
            id: null;
            youtubeId: string;
            title: string | null;
            artist: string | null;
            albumCover: string | null;
        } | null;
        isLeader: boolean;
        isMember: boolean;
        role: string | null;
        leader: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        members: ({
            user: {
                id: number;
                email: string;
                profileImage: string | null;
            };
        } & {
            id: string;
            userId: number;
            roomId: string;
            role: string;
            joinedAt: Date;
        })[];
        queue: {
            id: string;
            createdAt: Date;
            title: string;
            artist: string | null;
            duration: string | null;
            songId: number | null;
            position: number;
            roomId: string;
            youtubeVideoId: string | null;
            thumbnail: string | null;
            addedById: number;
        }[];
        id: string;
        createdAt: Date;
        name: string;
        code: string;
        leaderId: number;
        currentSongId: number | null;
        currentSongYoutubeId: string | null;
        currentSongTitle: string | null;
        currentSongArtist: string | null;
        currentSongThumbnail: string | null;
        currentTime: number;
        isPlaying: boolean;
        lastActivityAt: Date;
    }>;
    joinRoom(code: string, userId: number): Promise<{
        currentSong: {
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
        } | {
            id: null;
            youtubeId: string;
            title: string | null;
            artist: string | null;
            albumCover: string | null;
        } | null;
        isLeader: boolean;
        isMember: boolean;
        role: string | null;
        leader: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        members: ({
            user: {
                id: number;
                email: string;
                profileImage: string | null;
            };
        } & {
            id: string;
            userId: number;
            roomId: string;
            role: string;
            joinedAt: Date;
        })[];
        queue: {
            id: string;
            createdAt: Date;
            title: string;
            artist: string | null;
            duration: string | null;
            songId: number | null;
            position: number;
            roomId: string;
            youtubeVideoId: string | null;
            thumbnail: string | null;
            addedById: number;
        }[];
        id: string;
        createdAt: Date;
        name: string;
        code: string;
        leaderId: number;
        currentSongId: number | null;
        currentSongYoutubeId: string | null;
        currentSongTitle: string | null;
        currentSongArtist: string | null;
        currentSongThumbnail: string | null;
        currentTime: number;
        isPlaying: boolean;
        lastActivityAt: Date;
    }>;
    leaveRoom(code: string, userId: number): Promise<{
        deleted: boolean;
        message: string;
    }>;
    kickMember(code: string, leaderId: number, targetId: number): Promise<{
        message: string;
    }>;
    playSong(code: string, userId: number, songData: {
        songId?: number;
        videoId?: string;
        title: string;
        artist?: string;
        thumbnail?: string;
        duration?: string;
    }): Promise<{
        message: string;
        songData: {
            songId?: number;
            videoId?: string;
            title: string;
            artist?: string;
            thumbnail?: string;
            duration?: string;
        };
    }>;
    updatePlayback(code: string, userId: number, data: {
        currentTime?: number;
        isPlaying?: boolean;
        duration?: number;
    }): Promise<{
        message: string;
    }>;
    addToQueue(code: string, userId: number, songData: {
        songId?: number;
        videoId?: string;
        title: string;
        artist?: string;
        thumbnail?: string;
        duration?: string;
    }): Promise<{
        addedBy: {
            id: number;
            email: string;
            profileImage: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        title: string;
        artist: string | null;
        duration: string | null;
        songId: number | null;
        position: number;
        roomId: string;
        youtubeVideoId: string | null;
        thumbnail: string | null;
        addedById: number;
    }>;
    removeFromQueue(code: string, userId: number, queueId: string): Promise<{
        message: string;
    }>;
    reorderQueue(code: string, userId: number, queueIds: string[]): Promise<{
        message: string;
    }>;
    clearQueue(code: string, userId: number): Promise<{
        message: string;
    }>;
    playNext(code: string, userId: number): Promise<{
        message: string;
        song: {
            songId: number | null;
            videoId: string | null;
            title: string;
            artist: string | null;
            thumbnail: string | null;
            duration: string | null;
        };
    }>;
    searchSongs(code: string, userId: number, query: string): Promise<any[]>;
    cleanupInactiveRooms(): Promise<void>;
}
