import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, Req, Headers, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { SongsService } from './songs.service';
import { StreamService } from './stream.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('songs')
@Controller('songs')
export class SongsController {
  constructor(
    private readonly songsService: SongsService,
    private readonly streamService: StreamService,
  ) {}

  @Get('stream')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream audio for a YouTube video (proxied from YouTube)' })
  async stream(
    @Query() query: any,
    @Headers('range') range?: string,
    @Res() res?: Response,
  ) {
    if (!res) throw new BadRequestException('No response');
    return this.streamService.stream(String(query.videoId || ''), range, res, !!query.debug);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all songs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.songsService.findAll(page || 1, limit || 20);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search songs' })
  async search(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.songsService.search(query, page || 1, limit || 12);
  }

  @Get('genres')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all available genres' })
  async getGenres() {
    return this.songsService.getGenres();
  }

  @Get('random')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a random song from database' })
  async getRandomSong(@Query('exclude') exclude?: string) {
    const excludeIds = exclude ? exclude.split(',').map(Number) : [];
    return this.songsService.getRandomSong(excludeIds);
  }

  @Get('genre/:genre')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get songs by genre' })
  async getByGenre(@Param('genre') genre: string, @Query('limit') limit?: number) {
    return this.songsService.getByGenre(genre, limit || 50);
  }

  @Get('genre/:genre/youtube')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get songs by genre from YouTube' })
  async getGenreFromYoutube(@Param('genre') genre: string, @Query('limit') limit?: number) {
    return this.songsService.getGenreFromYoutube(genre, limit || 20);
  }

  @Get('recommendations/ai')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI-powered song recommendations' })
  async getAiRecommendations(@Req() req) {
    return this.songsService.getAiRecommendations(req.user?.id);
  }

  @Get('mood/:mood')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get songs by mood' })
  async getMoodPlaylist(
    @Param('mood') mood: string,
    @Query('limit') limit?: number,
  ) {
    return this.songsService.getMoodPlaylist(mood, limit || 20);
  }

  @Get(':id/youtube-recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get YouTube related songs for a song' })
  async getYoutubeRecommendations(@Param('id') id: number) {
    return this.songsService.getYoutubeRecommendations(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get song by ID' })
  async findById(@Param('id') id: number) {
    return this.songsService.findById(id);
  }

  @Get(':id/lyrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lyrics for a song' })
  async getLyrics(@Param('id') id: number) {
    return this.songsService.getLyrics(id);
  }

  @Get(':id/funfacts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get fun facts for a song' })
  async getFunFacts(@Param('id') id: number) {
    return this.songsService.getFunFacts(id);
  }

  @Get(':id/recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get similar song recommendations' })
  async getRecommendations(@Param('id') id: number, @Query('limit') limit?: number) {
    return this.songsService.getRecommendations(id, limit || 10);
  }

  @Post('save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a YouTube song to database' })
  async saveFromYoutube(@Body('videoId') videoId: string) {
    return this.songsService.saveFromYoutube(videoId);
  }

  @Post('save-from-cache')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a song from cached recommendation data (no YouTube API call)' })
  async saveFromCache(
    @Body('videoId') videoId: string,
    @Body('title') title: string,
    @Body('artist') artist: string,
    @Body('albumCover') albumCover?: string,
  ) {
    return this.songsService.saveFromCache(videoId, title, artist, albumCover);
  }

  @Put(':id/youtube')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update YouTube video ID' })
  async updateYoutubeId(@Param('id') id: number, @Body('youtubeId') youtubeId: string) {
    return this.songsService.updateYoutubeId(id, youtubeId);
  }

  @Put(':id/lyrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lyrics' })
  async updateLyrics(@Param('id') id: number, @Body('lyrics') lyrics: string) {
    return this.songsService.updateLyrics(id, lyrics);
  }
}
