import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  async createRoom(
    @Req() req,
    @Body('name') name: string,
  ) {
    return this.roomService.createRoom(req.user.id, name);
  }

  @Get(':code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get room info by code' })
  @ApiResponse({ status: 200, description: 'Room info retrieved' })
  async getRoom(
    @Param('code') code: string,
    @Req() req,
  ) {
    return this.roomService.getRoom(code, req.user.id);
  }

  @Post(':code/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a room' })
  @ApiResponse({ status: 200, description: 'Joined room successfully' })
  async joinRoom(
    @Param('code') code: string,
    @Req() req,
  ) {
    return this.roomService.joinRoom(code, req.user.id);
  }

  @Post(':code/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a room' })
  @ApiResponse({ status: 200, description: 'Left room' })
  async leaveRoom(
    @Param('code') code: string,
    @Req() req,
  ) {
    return this.roomService.leaveRoom(code, req.user.id);
  }

  @Post(':code/kick/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kick a member (leader only)' })
  @ApiResponse({ status: 200, description: 'Member kicked' })
  async kickMember(
    @Param('code') code: string,
    @Param('userId') targetId: number,
    @Req() req,
  ) {
    return this.roomService.kickMember(code, req.user.id, targetId);
  }

  @Put(':code/play')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Play a song (leader only)' })
  @ApiResponse({ status: 200, description: 'Song is now playing' })
  async playSong(
    @Param('code') code: string,
    @Req() req,
    @Body() songData: {
      songId?: number;
      videoId?: string;
      title: string;
      artist?: string;
      thumbnail?: string;
      duration?: string;
    },
  ) {
    return this.roomService.playSong(code, req.user.id, songData);
  }

  @Put(':code/playback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update playback state (leader only)' })
  @ApiResponse({ status: 200, description: 'Playback updated' })
  async updatePlayback(
    @Param('code') code: string,
    @Req() req,
    @Body() data: { currentTime?: number; isPlaying?: boolean },
  ) {
    return this.roomService.updatePlayback(code, req.user.id, data);
  }

  @Post(':code/queue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add song to queue (leader only)' })
  @ApiResponse({ status: 201, description: 'Song added to queue' })
  async addToQueue(
    @Param('code') code: string,
    @Req() req,
    @Body() songData: {
      songId?: number;
      videoId?: string;
      title: string;
      artist?: string;
      thumbnail?: string;
      duration?: string;
    },
  ) {
    return this.roomService.addToQueue(code, req.user.id, songData);
  }

  @Delete(':code/queue/:queueId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove song from queue (leader only)' })
  @ApiResponse({ status: 200, description: 'Song removed from queue' })
  async removeFromQueue(
    @Param('code') code: string,
    @Param('queueId') queueId: string,
    @Req() req,
  ) {
    return this.roomService.removeFromQueue(code, req.user.id, queueId);
  }

  @Delete(':code/queue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all queue (leader only)' })
  @ApiResponse({ status: 200, description: 'Queue cleared' })
  async clearQueue(
    @Param('code') code: string,
    @Req() req,
  ) {
    return this.roomService.clearQueue(code, req.user.id);
  }

  @Put(':code/queue/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder queue (leader only)' })
  @ApiResponse({ status: 200, description: 'Queue reordered' })
  async reorderQueue(
    @Param('code') code: string,
    @Req() req,
    @Body('queueIds') queueIds: string[],
  ) {
    return this.roomService.reorderQueue(code, req.user.id, queueIds);
  }

  @Post(':code/queue/next')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Play next song from queue (leader only)' })
  @ApiResponse({ status: 200, description: 'Playing next song' })
  async playNext(
    @Param('code') code: string,
    @Req() req,
  ) {
    return this.roomService.playNext(code, req.user.id);
  }

  @Get(':code/search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search songs for room (DB + YouTube)' })
  @ApiQuery({ name: 'q', required: true })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchSongs(
    @Param('code') code: string,
    @Query('q') query: string,
    @Req() req,
  ) {
    return this.roomService.searchSongs(code, req.user.id, query);
  }
}
