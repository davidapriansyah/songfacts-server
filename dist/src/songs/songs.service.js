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
var SongsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SongsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const youtube_service_1 = require("./youtube.service");
const lyrics_service_1 = require("./lyrics.service");
const gemini_service_1 = require("./gemini.service");
const axios_1 = require("axios");
let SongsService = SongsService_1 = class SongsService {
    constructor(prisma, youtube, lyrics, gemini) {
        this.prisma = prisma;
        this.youtube = youtube;
        this.lyrics = lyrics;
        this.gemini = gemini;
        this.logger = new common_1.Logger(SongsService_1.name);
    }
    async findAll(page = 1, limit = 20) {
        const [songs, total] = await Promise.all([
            this.prisma.song.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.song.count(),
        ]);
        return {
            data: songs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getRandomSong(excludeIds = []) {
        const where = excludeIds.length > 0
            ? { id: { notIn: excludeIds } }
            : {};
        const count = await this.prisma.song.count({ where });
        if (count === 0) {
            return this.prisma.song.findFirst();
        }
        const skip = Math.floor(Math.random() * count);
        return this.prisma.song.findFirst({
            where,
            skip,
        });
    }
    async search(query, page = 1, limit = 12) {
        const dbSongs = await this.prisma.song.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { artist: { contains: query, mode: 'insensitive' } },
                ],
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
        if (dbSongs.length > 0) {
            const total = await this.prisma.song.count({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { artist: { contains: query, mode: 'insensitive' } },
                    ],
                },
            });
            return { songs: dbSongs, total, page, limit, source: 'database' };
        }
        const youtubeResults = await this.youtube.searchVideos(query, limit);
        const results = youtubeResults.map((video) => {
            const snippet = video.snippet;
            const videoId = video.id.videoId;
            const { artist, title } = this.parseVideoTitle(snippet.title);
            return {
                videoId,
                title,
                artist,
                channel: snippet.channelTitle,
                thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                publishedAt: snippet.publishedAt,
            };
        });
        return { songs: results, total: results.length, page, limit, source: 'youtube' };
    }
    async saveFromYoutube(videoId) {
        const existingSong = await this.prisma.song.findFirst({
            where: { youtubeId: videoId },
        });
        if (existingSong) {
            return existingSong;
        }
        const videos = await this.youtube.searchVideos(`yt:${videoId}`, 1);
        if (videos.length === 0) {
            const response = await axios_1.default.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${this.youtube['apiKey']}`);
            const video = response.data.items?.[0];
            if (!video) {
                throw new common_1.NotFoundException('Video not found');
            }
            const snippet = video.snippet;
            const { artist, title } = this.parseVideoTitle(snippet.title);
            const song1 = await this.prisma.song.create({
                data: {
                    youtubeId: videoId,
                    title,
                    artist,
                    album: snippet.channelTitle,
                    albumCover: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                    genres: [],
                },
            });
            await this.prisma.userRecommendation.deleteMany({});
            return song1;
        }
        const snippet = videos[0].snippet;
        const { artist, title } = this.parseVideoTitle(snippet.title);
        const song2 = await this.prisma.song.create({
            data: {
                youtubeId: videoId,
                title,
                artist,
                album: snippet.channelTitle,
                albumCover: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                genres: [],
            },
        });
        await this.prisma.userRecommendation.deleteMany({});
        return song2;
    }
    async saveFromCache(videoId, title, artist, albumCover) {
        const existingSong = await this.prisma.song.findFirst({
            where: { youtubeId: videoId },
        });
        if (existingSong) {
            return existingSong;
        }
        const song = await this.prisma.song.create({
            data: {
                youtubeId: videoId,
                title,
                artist,
                albumCover: albumCover || null,
                genres: [],
            },
        });
        await this.prisma.userRecommendation.deleteMany({});
        return song;
    }
    parseVideoTitle(videoTitle) {
        const separators = [' - ', ' – ', ' | ', ' by ', ': '];
        for (const sep of separators) {
            if (videoTitle.includes(sep)) {
                const parts = videoTitle.split(sep);
                return { artist: parts[0].trim(), title: parts.slice(1).join(sep).trim() };
            }
        }
        return { artist: 'Unknown Artist', title: videoTitle };
    }
    async findById(id) {
        const song = await this.prisma.song.findUnique({
            where: { id },
            include: { songFact: true },
        });
        if (!song) {
            throw new common_1.NotFoundException('Song not found');
        }
        return song;
    }
    async getLyrics(songId) {
        const song = await this.prisma.song.findUnique({
            where: { id: songId },
        });
        if (!song) {
            throw new common_1.NotFoundException('Song not found');
        }
        // Return cached lyrics if available (non-empty)
        if (song.lyrics && song.lyrics.trim() !== '') {
            return { lyrics: song.lyrics, synced: null, cached: true };
        }
        // Fetch from LRCLIB
        const lyricsData = await this.lyrics.findLyrics(song.artist, song.title);
        // Only cache if we actually found meaningful lyrics
        const plainLyrics = lyricsData?.plain?.trim() || null;
        const syncedLyrics = lyricsData?.synced?.trim() || null;
        if (plainLyrics || syncedLyrics) {
            const lyricsToCache = plainLyrics || syncedLyrics;
            await this.prisma.song.update({
                where: { id: songId },
                data: { lyrics: lyricsToCache },
            });
            return {
                lyrics: plainLyrics,
                synced: syncedLyrics,
                cached: false,
            };
        }
        // LRCLIB doesn't have this song's lyrics — leave as null in DB
        // Next request will retry LRCLIB in case they've been added since
        return {
            lyrics: null,
            synced: null,
            cached: false,
            message: 'Lyrics not found',
        };
    }
    async getFunFacts(songId) {
        const song = await this.prisma.song.findUnique({
            where: { id: songId },
        });
        if (!song) {
            throw new common_1.NotFoundException('Song not found');
        }
        // Check cache
        const cachedFact = await this.prisma.songFact.findUnique({
            where: { songId },
        });
        // Use cache if it has real content
        if (cachedFact) {
            const facts = cachedFact.funFacts;
            const hasRealData = facts &&
                typeof facts === 'object' &&
                ((facts.artist?.funfacts?.length > 0 && facts.artist.funfacts[0] !== 'Gagal mengambil data fun fact' && facts.artist.funfacts[0] !== 'Gemini API belum dikonfigurasi') ||
                    (facts.song?.funfacts?.length > 0 && facts.song.funfacts[0] !== 'Gagal mengambil data fun fact' && facts.song.funfacts[0] !== 'Gemini API belum dikonfigurasi'));
            if (hasRealData) {
                return cachedFact.funFacts;
            }
            // Cached data is empty/error — delete and regenerate
            this.logger.log(`Cached fun facts for song ${songId} is empty/error, regenerating...`);
            await this.prisma.songFact.delete({ where: { songId } });
        }
        // Generate new fun facts
        const funFacts = await this.gemini.generateSongFacts(song.artist, song.title);
        // Save to DB using upsert to avoid race condition (two concurrent requests could both try to create)
        await this.prisma.songFact.upsert({
            where: { songId },
            update: { funFacts },
            create: {
                songId,
                funFacts,
            },
        });
        return funFacts;
    }
    async getRecommendations(songId, limit = 10) {
        const song = await this.prisma.song.findUnique({
            where: { id: songId },
        });
        if (!song) {
            throw new common_1.NotFoundException('Song not found');
        }
        const recommendations = await this.prisma.song.findMany({
            where: {
                AND: [
                    { id: { not: songId } },
                    {
                        OR: [
                            { artist: song.artist },
                            { genres: { hasSome: song.genres } },
                        ],
                    },
                ],
            },
            take: limit,
        });
        if (recommendations.length === 0) {
            return this.prisma.song.findMany({
                where: { id: { not: songId } },
                take: limit,
                orderBy: { title: 'asc' },
            });
        }
        return recommendations;
    }
    async getMoodPlaylist(mood, limit = 20) {
        const moodGenreMap = {
            happy: ['Pop', 'Dangdut Pop', 'Indonesian Pop'],
            sad: ['Rock Ballad', 'Pop Ballad'],
            energetic: ['Rock', 'Punk Rock', 'Alternative Rock'],
            chill: ['Jazz', 'R&B', 'Indonesian Pop'],
            romantic: ['Pop Ballad', 'R&B', 'Indonesian Pop'],
            focus: ['Alternative Rock', 'Pop Rock'],
            workout: ['Rock', 'Punk Rock', 'Alternative Rock'],
        };
        const genres = moodGenreMap[mood] || [];
        let songs = await this.prisma.song.findMany({
            where: genres.length > 0 ? { genres: { hasSome: genres } } : {},
            take: limit,
            orderBy: { title: 'asc' },
        });
        if (songs.length === 0) {
            songs = await this.prisma.song.findMany({
                take: limit,
                orderBy: { title: 'asc' },
            });
        }
        return songs;
    }
    async updateYoutubeId(songId, youtubeId) {
        const song = await this.prisma.song.findUnique({
            where: { id: songId },
        });
        if (!song) {
            throw new common_1.NotFoundException('Song not found');
        }
        return this.prisma.song.update({
            where: { id: songId },
            data: { youtubeId },
        });
    }
    async updateLyrics(songId, lyrics) {
        const song = await this.prisma.song.findUnique({
            where: { id: songId },
        });
        if (!song) {
            throw new common_1.NotFoundException('Song not found');
        }
        return this.prisma.song.update({
            where: { id: songId },
            data: { lyrics },
        });
    }
    async getGenres() {
        const songs = await this.prisma.song.findMany({ select: { genres: true } });
        const genreSet = new Set();
        songs.forEach((s) => s.genres.forEach((g) => genreSet.add(g)));
        // Always include these genres even if no songs in DB
        const additionalGenres = [
            'Emo Barat', 'Emo Indo',
            'Pop Punk Indo', 'Pop Punk Barat',
            'Alternative Rock',
            'Indonesian Pop 2000s', 'Barat Pop 2000s',
            'Dangdut',
            'Reggae Indonesia', 'Reggae Barat',
        ];
        additionalGenres.forEach((g) => genreSet.add(g));
        return Array.from(genreSet).sort();
    }
    async getByGenre(genre, limit = 50) {
        return this.prisma.song.findMany({
            where: { genres: { has: genre } },
            take: limit,
            orderBy: { title: 'asc' },
        });
    }
    async getGenreFromYoutube(genre, limit = 20) {
        // Build search query based on genre
        const genreSearchMap = {
            'Emo Barat': 'emo rock music official audio',
            'Emo Indo': 'music indonesia emo',
            'Pop Punk Indo': 'pop punk indonesia music',
            'Pop Punk Barat': 'pop punk music official audio',
            'Alternative Rock': 'alternative rock music official audio',
            'Indonesian Pop 2000s': 'lagu indonesia pop 2000an',
            'Barat Pop 2000s': 'pop music 2000s official audio',
            'Dangdut': 'dangdut music official audio',
            'Reggae Indonesia': 'reggae indonesia music',
            'Reggae Barat': 'reggae music official audio',
        };
        const searchQuery = genreSearchMap[genre] || `${genre} music official audio`;
        const items = await this.youtube.searchVideos(searchQuery, limit);
        const results = [];
        const blacklisted = [
            'kumpulan', 'compilation', 'collection', 'full album',
            'lagu', 'tembang', 'terlengkap', 'terbaru',
            'mix', 'medley', 'mega', 'terbaik', 'playlist',
        ];
        for (const item of items) {
            const videoId = item.id.videoId;
            const title = (item.snippet?.title || '').toLowerCase();
            if (blacklisted.some((w) => title.includes(w)))
                continue;
            const parsed = this.parseVideoTitle(item.snippet.title);
            const existingSong = await this.prisma.song.findFirst({
                where: { youtubeId: videoId },
            });
            results.push({
                ...(existingSong || {}),
                videoId,
                title: existingSong?.title || parsed.title,
                artist: existingSong?.artist || parsed.artist,
                albumCover: existingSong?.albumCover || item.snippet.thumbnails?.high?.url,
                inDb: !!existingSong,
            });
        }
        return results;
    }
    async getAiRecommendations(userId) {
        // Check cache first (only for logged-in users)
        if (userId) {
            const cached = await this.prisma.userRecommendation.findUnique({
                where: { userId },
            });
            if (cached) {
                const songs = cached.songs;
                if (Array.isArray(songs) && songs.length > 0) {
                    // Refresh inDb status for each cached song
                    const refreshed = await Promise.all(songs.map(async (song) => {
                        if (song.inDb)
                            return song;
                        if (!song.videoId)
                            return song;
                        const existingSong = await this.prisma.song.findFirst({
                            where: { youtubeId: song.videoId },
                        });
                        if (existingSong) {
                            return { ...song, inDb: true, id: existingSong.id };
                        }
                        return song;
                    }));
                    return { source: cached.source, songs: refreshed };
                }
                // Cached data is empty — delete and re-fetch
                this.logger.log(`Cached AI recommendations for user ${userId} is empty, re-fetching...`);
                await this.prisma.userRecommendation.delete({ where: { userId } });
            }
        }
        // Generate new recommendations
        let listeningHistory = [];
        let topGenres = [];
        if (userId) {
            const favorites = await this.prisma.favorite.findMany({
                where: { userId },
                include: { song: { select: { genres: true, artist: true } } },
                take: 20,
            });
            listeningHistory = favorites.map((f) => `${f.song.artist} (${f.song.genres.join(', ')})`);
            const genreCount = new Map();
            favorites.forEach((f) => f.song.genres.forEach((g) => {
                genreCount.set(g, (genreCount.get(g) || 0) + 1);
            }));
            topGenres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
        }
        const dbSongs = await this.prisma.song.findMany({
            select: { id: true, title: true, artist: true, genres: true, youtubeId: true, albumCover: true },
            orderBy: { createdAt: 'desc' },
        });
        const dbResults = dbSongs.map((s) => ({ ...s, inDb: true }));
        let youtubeResults = [];
        const searchQueries = topGenres.length > 0
            ? topGenres.map((g) => `${g} music`).slice(0, 2)
            : ['pop music', 'latest music'];
        try {
            for (const q of searchQueries) {
                const items = await this.youtube.searchVideos(q, 6);
                for (const item of items) {
                    const videoId = item.id.videoId;
                    const title = (item.snippet?.title || '').toLowerCase();
                    const blacklisted = [
                        'kumpulan', 'compilation', 'collection', 'full album',
                        'lagu', 'tembang', 'terlengkap', 'terbaru',
                        'mix', 'medley', 'mega', 'terbaik',
                    ];
                    if (blacklisted.some((w) => title.includes(w)))
                        continue;
                    const existsInDb = dbSongs.some((s) => s.youtubeId === videoId);
                    if (existsInDb)
                        continue;
                    const parsed = this.parseVideoTitle(item.snippet.title);
                    youtubeResults.push({
                        videoId,
                        title: parsed.title,
                        artist: parsed.artist,
                        albumCover: item.snippet.thumbnails?.high?.url,
                        inDb: false,
                    });
                }
            }
        }
        catch (error) {
            this.logger.warn(`YouTube recommendations failed: ${error.message}`);
        }
        const mixed = [];
        const seenIds = new Set();
        const dbPool = [...dbResults];
        const ytPool = [...youtubeResults];
        // Interleave db and youtube results for variety
        while (mixed.length < 12 && (dbPool.length > 0 || ytPool.length > 0)) {
            if (dbPool.length > 0) {
                const song = dbPool.splice(Math.floor(Math.random() * dbPool.length), 1)[0];
                if (!seenIds.has(song.id)) {
                    seenIds.add(song.id);
                    mixed.push(song);
                }
            }
            if (ytPool.length > 0 && mixed.length < 12) {
                const song = ytPool.splice(Math.floor(Math.random() * ytPool.length), 1)[0];
                if (!seenIds.has(song.videoId)) {
                    seenIds.add(song.videoId);
                    mixed.push(song);
                }
            }
        }
        // If still less than 10 results, pad with random songs from DB
        if (mixed.length < 10) {
            const remainingDbSongs = await this.prisma.song.findMany({
                select: { id: true, title: true, artist: true, genres: true, youtubeId: true, albumCover: true },
                where: { id: { notIn: [...seenIds].filter((id) => typeof id === 'number') } },
                take: 15,
                orderBy: { title: 'asc' },
            });
            for (const song of remainingDbSongs) {
                if (mixed.length >= 12)
                    break;
                if (!seenIds.has(song.id)) {
                    seenIds.add(song.id);
                    mixed.push({ ...song, inDb: true });
                }
            }
        }
        const source = mixed.some((s) => !s.inDb) ? 'mixed' : 'db';
        // Cache to DB (only for logged-in users)
        if (userId) {
            await this.prisma.userRecommendation.upsert({
                where: { userId },
                update: {
                    songs: mixed,
                    source,
                    generatedAt: new Date(),
                },
                create: {
                    userId,
                    songs: mixed,
                    source,
                },
            });
        }
        return { source, songs: mixed };
    }
    async getYoutubeRecommendations(songId) {
        const song = await this.prisma.song.findUnique({ where: { id: songId } });
        if (!song)
            throw new common_1.NotFoundException('Song not found');
        // Check cache first
        const cached = await this.prisma.songRecommendation.findUnique({
            where: { songId },
        });
        if (cached) {
            const recs = cached.recommendations;
            if (Array.isArray(recs) && recs.length > 0) {
                // Refresh inDb status for each cached recommendation
                const refreshed = await Promise.all(recs.map(async (rec) => {
                    if (rec.inDb)
                        return rec;
                    const existingSong = await this.prisma.song.findFirst({
                        where: { youtubeId: rec.videoId },
                    });
                    if (existingSong) {
                        return { ...rec, inDb: true, id: existingSong.id, title: existingSong.title, artist: existingSong.artist, albumCover: existingSong.albumCover };
                    }
                    return rec;
                }));
                return refreshed;
            }
            // Cached data is empty — delete and re-fetch
            this.logger.log(`Cached recommendations for song ${songId} is empty, re-fetching...`);
            await this.prisma.songRecommendation.delete({ where: { songId } });
        }
        // Fetch from YouTube
        const youtubeResults = await this.youtube.searchRelated(song.artist, song.genres, 12);
        const results = [];
        const seenVideoIds = new Set();
        for (const item of youtubeResults) {
            const videoId = item.id.videoId;
            if (seenVideoIds.has(videoId))
                continue;
            seenVideoIds.add(videoId);
            const snippet = item.snippet;
            const parsed = this.parseVideoTitle(snippet.title);
            const existingSong = await this.prisma.song.findFirst({
                where: { youtubeId: videoId },
            });
            results.push({
                ...(existingSong || {}),
                videoId,
                title: existingSong?.title || parsed.title,
                artist: existingSong?.artist || parsed.artist,
                albumCover: existingSong?.albumCover || snippet.thumbnails?.high?.url,
                inDb: !!existingSong,
            });
        }
        // Cache to DB (cached forever, retry if empty next time)
        await this.prisma.songRecommendation.create({
            data: {
                songId,
                recommendations: results,
            },
        });
        return results;
    }
};
exports.SongsService = SongsService;
exports.SongsService = SongsService = SongsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        youtube_service_1.YoutubeService,
        lyrics_service_1.LyricsService,
        gemini_service_1.GeminiService])
], SongsService);
//# sourceMappingURL=songs.service.js.map