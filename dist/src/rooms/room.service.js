"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RoomService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const youtube_service_1 = require("../songs/youtube.service");
const room_gateway_1 = require("./room.gateway");
let RoomService = RoomService_1 = class RoomService {
    constructor(prisma, youtube, gateway) {
        this.prisma = prisma;
        this.youtube = youtube;
        this.gateway = gateway;
        this.logger = new common_1.Logger(RoomService_1.name);
        // Cleanup inactive rooms every 10 minutes
        setInterval(() => this.cleanupInactiveRooms(), 10 * 60 * 1000);
    }
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    async createRoom(userId, name) {
        // Check if user already owns an active room
        const existingRoom = await this.prisma.room.findFirst({
            where: {
                leaderId: userId,
                lastActivityAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }
            },
            include: {
                leader: { select: { id: true, email: true, profileImage: true } },
                members: { include: { user: { select: { id: true, email: true, profileImage: true } } } },
                queue: { orderBy: { position: 'asc' } },
                currentSong: true,
            },
        });
        if (existingRoom) {
            // Check if user is still a member
            const member = await this.prisma.roomMember.findUnique({
                where: { roomId_userId: { roomId: existingRoom.id, userId } }
            });
            if (member) {
                // Return existing room instead of throwing error
                return { ...existingRoom, isLeader: true, isMember: true, role: 'LEADER' };
            }
            // User is not a member anymore, clean up the stale room
            await this.prisma.room.delete({ where: { id: existingRoom.id } });
        }
        let code = this.generateRoomCode();
        let isUnique = false;
        while (!isUnique) {
            const existing = await this.prisma.room.findUnique({ where: { code } });
            if (!existing)
                isUnique = true;
            else
                code = this.generateRoomCode();
        }
        const room = await this.prisma.room.create({
            data: {
                code,
                name,
                leaderId: userId,
                lastActivityAt: new Date(),
            },
            include: {
                leader: { select: { id: true, email: true, profileImage: true } },
                members: { include: { user: { select: { id: true, email: true, profileImage: true } } } },
                queue: { orderBy: { position: 'asc' } },
            },
        });
        // Add leader as member
        await this.prisma.roomMember.create({
            data: {
                roomId: room.id,
                userId,
                role: 'LEADER',
            },
        });
        return {
            ...room,
            isLeader: true,
        };
    }
    async getRoom(code, userId) {
        const room = await this.prisma.room.findUnique({
            where: { code },
            include: {
                leader: { select: { id: true, email: true, profileImage: true } },
                members: { include: { user: { select: { id: true, email: true, profileImage: true } } } },
                queue: { orderBy: { position: 'asc' } },
                currentSong: true,
            },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        // Update last activity
        await this.prisma.room.update({
            where: { id: room.id },
            data: { lastActivityAt: new Date() },
        });
        const isLeader = room.leaderId === userId;
        const member = room.members.find(m => m.userId === userId);
        const isMember = !!member;
        // Build currentSong from relation OR from stored fields (for YouTube-only songs)
        const currentSong = room.currentSong || (room.currentSongYoutubeId ? {
            id: null,
            youtubeId: room.currentSongYoutubeId,
            title: room.currentSongTitle,
            artist: room.currentSongArtist,
            albumCover: room.currentSongThumbnail,
        } : null);
        return {
            ...room,
            currentSong,
            isLeader,
            isMember,
            role: member?.role || null,
        };
    }
    async joinRoom(code, userId) {
        const room = await this.prisma.room.findUnique({
            where: { code },
            include: { members: true },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        // Check max members (10)
        if (room.members.length >= 10) {
            throw new common_1.BadRequestException('Room is full (max 10 members)');
        }
        // Check if already a member
        const existingMember = room.members.find(m => m.userId === userId);
        if (existingMember) {
            throw new common_1.BadRequestException('You are already in this room');
        }
        // Add member
        await this.prisma.roomMember.create({
            data: {
                roomId: room.id,
                userId,
                role: 'FOLLOWER',
            },
        });
        // Update last activity
        await this.prisma.room.update({
            where: { id: room.id },
            data: { lastActivityAt: new Date() },
        });
        // Broadcast member joined to all clients in room (including leader)
        const updatedMembers = await this.prisma.roomMember.findMany({
            where: { roomId: room.id },
            include: { user: { select: { id: true, email: true, profileImage: true } } },
        });
        this.gateway.broadcastToRoom(code, 'member:joined', {
            members: updatedMembers,
            notification: 'A new member joined the room!',
        });
        // Get updated room
        return this.getRoom(code, userId);
    }
    async leaveRoom(code, userId) {
        const room = await this.prisma.room.findUnique({
            where: { code },
            include: { members: true },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        const member = room.members.find(m => m.userId === userId);
        if (!member) {
            throw new common_1.BadRequestException('You are not in this room');
        }
        // Remove member
        await this.prisma.roomMember.delete({
            where: { id: member.id },
        });
        let newLeaderId = null;
        // If leader leaves and there are other members, transfer leadership
        if (room.leaderId === userId && room.members.length > 1) {
            const nextLeader = room.members.find(m => m.userId !== userId);
            if (nextLeader) {
                newLeaderId = nextLeader.userId;
                await this.prisma.room.update({
                    where: { id: room.id },
                    data: { leaderId: nextLeader.userId },
                });
                await this.prisma.roomMember.update({
                    where: { id: nextLeader.id },
                    data: { role: 'LEADER' },
                });
            }
        }
        // If last member leaves, delete room
        if (room.members.length <= 1) {
            await this.prisma.room.delete({ where: { id: room.id } });
            this.gateway.broadcastToRoom(code, 'room:deleted', {});
            return { deleted: true, message: 'Room deleted (no members left)' };
        }
        // Update last activity
        await this.prisma.room.update({
            where: { id: room.id },
            data: { lastActivityAt: new Date() },
        });
        // Broadcast member left (include newLeaderId if leadership transferred)
        const remainingMembers = await this.prisma.roomMember.findMany({
            where: { roomId: room.id },
            include: { user: { select: { id: true, email: true, profileImage: true } } },
        });
        this.gateway.broadcastToRoom(code, 'member:left', {
            members: remainingMembers,
            newLeaderId,
        });
        return { deleted: false, message: 'Left room' };
    }
    async kickMember(code, leaderId, targetId) {
        const room = await this.prisma.room.findUnique({
            where: { code },
            include: { members: true },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.leaderId !== leaderId) {
            throw new common_1.ForbiddenException('Only the leader can kick members');
        }
        const targetMember = room.members.find(m => m.userId === targetId);
        if (!targetMember) {
            throw new common_1.BadRequestException('Target user is not in this room');
        }
        await this.prisma.roomMember.delete({
            where: { id: targetMember.id },
        });
        // Broadcast member kicked
        const remainingMembers = await this.prisma.roomMember.findMany({
            where: { roomId: room.id },
            include: { user: { select: { id: true, email: true, profileImage: true } } },
        });
        this.gateway.broadcastToRoom(code, 'member:kicked', {
            members: remainingMembers,
            kickedUserId: targetId,
        });
        return { message: 'Member kicked' };
    }
    async playSong(code, userId, songData) {
        const room = await this.prisma.room.findUnique({
            where: { code },
            include: { members: true },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.leaderId !== userId) {
            throw new common_1.ForbiddenException('Only the leader can play songs');
        }
        await this.prisma.room.update({
            where: { id: room.id },
            data: {
                currentSongId: songData.songId || null,
                currentSongYoutubeId: songData.videoId || null,
                currentSongTitle: songData.title || null,
                currentSongArtist: songData.artist || null,
                currentSongThumbnail: songData.thumbnail || null,
                currentTime: 0,
                isPlaying: true,
                lastActivityAt: new Date(),
            },
        });
        // Broadcast to all clients in room
        this.gateway.broadcastToRoom(code, 'song:changed', {
            currentSong: {
                id: songData.songId || null,
                youtubeId: songData.videoId,
                title: songData.title,
                artist: songData.artist,
                albumCover: songData.thumbnail,
            },
            isPlaying: true,
            currentTime: 0,
        });
        return { message: 'Song is now playing', songData };
    }
    async updatePlayback(code, userId, data) {
        const room = await this.prisma.room.findUnique({
            where: { code },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.leaderId !== userId) {
            throw new common_1.ForbiddenException('Only the leader can control playback');
        }
        await this.prisma.room.update({
            where: { id: room.id },
            data: {
                ...(data.currentTime !== undefined && { currentTime: data.currentTime }),
                ...(data.isPlaying !== undefined && { isPlaying: data.isPlaying }),
                lastActivityAt: new Date(),
            },
        });
        // Broadcast to all clients in room (include duration for follower sync)
        this.gateway.broadcastToRoom(code, 'playback:updated', {
            currentTime: data.currentTime,
            isPlaying: data.isPlaying,
            duration: data.duration,
        });
        return { message: 'Playback updated' };
    }
    async addToQueue(code, userId, songData) {
        const room = await this.prisma.room.findUnique({
            where: { code },
            include: { queue: true },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.leaderId !== userId) {
            throw new common_1.ForbiddenException('Only the leader can add songs to queue');
        }
        const maxPosition = room.queue.length > 0
            ? Math.max(...room.queue.map(q => q.position))
            : -1;
        const queueItem = await this.prisma.roomQueue.create({
            data: {
                roomId: room.id,
                songId: songData.songId || null,
                youtubeVideoId: songData.videoId || null,
                title: songData.title,
                artist: songData.artist || null,
                thumbnail: songData.thumbnail || null,
                duration: songData.duration || null,
                addedById: userId,
                position: maxPosition + 1,
            },
            include: {
                addedBy: { select: { id: true, email: true, profileImage: true } },
            },
        });
        // Update last activity
        await this.prisma.room.update({
            where: { id: room.id },
            data: { lastActivityAt: new Date() },
        });
        // Broadcast updated queue
        const updatedQueue = await this.prisma.roomQueue.findMany({
            where: { roomId: room.id },
            orderBy: { position: 'asc' },
            include: { addedBy: { select: { id: true, email: true, profileImage: true } } },
        });
        this.gateway.broadcastToRoom(code, 'queue:updated', { queue: updatedQueue });
        return queueItem;
    }
    async removeFromQueue(code, userId, queueId) {
        const room = await this.prisma.room.findUnique({
            where: { code },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.leaderId !== userId) {
            throw new common_1.ForbiddenException('Only the leader can remove songs from queue');
        }
        const queueItem = await this.prisma.roomQueue.findUnique({
            where: { id: queueId },
        });
        if (!queueItem || queueItem.roomId !== room.id) {
            throw new common_1.NotFoundException('Queue item not found');
        }
        await this.prisma.roomQueue.delete({
            where: { id: queueId },
        });
        // Reorder remaining items
        const remaining = await this.prisma.roomQueue.findMany({
            where: { roomId: room.id },
            orderBy: { position: 'asc' },
        });
        for (let i = 0; i < remaining.length; i++) {
            await this.prisma.roomQueue.update({
                where: { id: remaining[i].id },
                data: { position: i },
            });
        }
        // Update last activity
        await this.prisma.room.update({
            where: { id: room.id },
            data: { lastActivityAt: new Date() },
        });
        // Broadcast updated queue
        const updatedQueue = await this.prisma.roomQueue.findMany({
            where: { roomId: room.id },
            orderBy: { position: 'asc' },
            include: { addedBy: { select: { id: true, email: true, profileImage: true } } },
        });
        this.gateway.broadcastToRoom(code, 'queue:updated', { queue: updatedQueue });
        return { message: 'Song removed from queue' };
    }
    async reorderQueue(code, userId, queueIds) {
        const room = await this.prisma.room.findUnique({
            where: { code },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.leaderId !== userId) {
            throw new common_1.ForbiddenException('Only the leader can reorder the queue');
        }
        for (let i = 0; i < queueIds.length; i++) {
            await this.prisma.roomQueue.update({
                where: { id: queueIds[i] },
                data: { position: i },
            });
        }
        // Update last activity
        await this.prisma.room.update({
            where: { id: room.id },
            data: { lastActivityAt: new Date() },
        });
        return { message: 'Queue reordered' };
    }
    async clearQueue(code, userId) {
        const room = await this.prisma.room.findUnique({
            where: { code },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.leaderId !== userId) {
            throw new common_1.ForbiddenException('Only the leader can clear the queue');
        }
        await this.prisma.roomQueue.deleteMany({
            where: { roomId: room.id },
        });
        this.gateway.broadcastToRoom(code, 'queue:updated', { queue: [] });
        return { message: 'Queue cleared' };
    }
    async playNext(code, userId) {
        const room = await this.prisma.room.findUnique({
            where: { code },
            include: { queue: { orderBy: { position: 'asc' } } },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.leaderId !== userId) {
            throw new common_1.ForbiddenException('Only the leader can play next song');
        }
        if (room.queue.length === 0) {
            throw new common_1.BadRequestException('Queue is empty');
        }
        const nextSong = room.queue[0];
        // Update current song
        await this.prisma.room.update({
            where: { id: room.id },
            data: {
                currentSongId: nextSong.songId || null,
                currentSongYoutubeId: nextSong.youtubeVideoId || null,
                currentSongTitle: nextSong.title || null,
                currentSongArtist: nextSong.artist || null,
                currentSongThumbnail: nextSong.thumbnail || null,
                currentTime: 0,
                isPlaying: true,
                lastActivityAt: new Date(),
            },
        });
        // Remove from queue
        await this.prisma.roomQueue.delete({
            where: { id: nextSong.id },
        });
        // Build song data
        const song = {
            songId: nextSong.songId,
            videoId: nextSong.youtubeVideoId,
            title: nextSong.title,
            artist: nextSong.artist,
            thumbnail: nextSong.thumbnail,
            duration: nextSong.duration,
        };
        // Broadcast song change
        this.gateway.broadcastToRoom(code, 'song:changed', {
            currentSong: {
                id: nextSong.songId || null,
                youtubeId: nextSong.youtubeVideoId,
                title: nextSong.title,
                artist: nextSong.artist,
                albumCover: nextSong.thumbnail,
            },
            isPlaying: true,
            currentTime: 0,
        });
        // Broadcast updated queue
        const remainingQueue = await this.prisma.roomQueue.findMany({
            where: { roomId: room.id },
            orderBy: { position: 'asc' },
            include: { addedBy: { select: { id: true, email: true, profileImage: true } } },
        });
        this.gateway.broadcastToRoom(code, 'queue:updated', { queue: remainingQueue });
        return {
            message: 'Playing next song',
            song,
        };
    }
    async searchSongs(code, userId, query) {
        const room = await this.prisma.room.findUnique({
            where: { code },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        // Search in DB first
        const dbSongs = await this.prisma.song.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { artist: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 5,
        });
        // Search on YouTube (limited to save quota)
        let youtubeResults = [];
        if (dbSongs.length < 5) {
            try {
                const ytResults = await this.youtube.searchVideos(query, 5 - dbSongs.length);
                youtubeResults = ytResults.map((r) => ({
                    source: 'youtube',
                    id: null,
                    videoId: r.id?.videoId || r.videoId,
                    title: r.snippet?.title || r.title,
                    artist: r.snippet?.channelTitle || r.artist || 'YouTube',
                    thumbnail: r.snippet?.thumbnails?.high?.url || r.thumbnail,
                    duration: r.duration || null,
                }));
            }
            catch (error) {
                this.logger.error('YouTube search failed:', error.message);
            }
        }
        const dbResults = dbSongs.map(s => ({
            source: 'db',
            id: s.id,
            videoId: s.youtubeId,
            title: s.title,
            artist: s.artist,
            thumbnail: s.albumCover,
            duration: s.duration?.toString(),
        }));
        return [...dbResults, ...youtubeResults];
    }
    async cleanupInactiveRooms() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const inactiveRooms = await this.prisma.room.findMany({
            where: { lastActivityAt: { lt: oneHourAgo } },
        });
        if (inactiveRooms.length > 0) {
            this.logger.log(`Cleaning up ${inactiveRooms.length} inactive rooms`);
            for (const room of inactiveRooms) {
                await this.prisma.room.delete({ where: { id: room.id } });
            }
        }
    }
};
exports.RoomService = RoomService;
exports.RoomService = RoomService = RoomService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        youtube_service_1.YoutubeService,
        room_gateway_1.RoomGateway])
], RoomService);
//# sourceMappingURL=room.service.js.map