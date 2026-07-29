import { RoomService } from './room.service';
export declare class RoomController {
    private readonly roomService;
    constructor(roomService: RoomService);
    createRoom(req: any, name: string): Promise<{
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
    getRoom(code: string, req: any): Promise<{
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
    joinRoom(code: string, req: any): Promise<{
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
    leaveRoom(code: string, req: any): Promise<{
        deleted: boolean;
        message: string;
    }>;
    kickMember(code: string, targetId: number, req: any): Promise<{
        message: string;
    }>;
    playSong(code: string, req: any, songData: {
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
    updatePlayback(code: string, req: any, data: {
        currentTime?: number;
        isPlaying?: boolean;
    }): Promise<{
        message: string;
    }>;
    addToQueue(code: string, req: any, songData: {
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
    removeFromQueue(code: string, queueId: string, req: any): Promise<{
        message: string;
    }>;
    clearQueue(code: string, req: any): Promise<{
        message: string;
    }>;
    reorderQueue(code: string, req: any, queueIds: string[]): Promise<{
        message: string;
    }>;
    playNext(code: string, req: any): Promise<{
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
    searchSongs(code: string, query: string, req: any): Promise<any[]>;
}
