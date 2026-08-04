import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { YoutubeService } from './youtube.service';
import { LyricsService } from './lyrics.service';
import { GeminiService } from './gemini.service';
import { StreamService } from './stream.service';

@Module({
  controllers: [SongsController],
  providers: [SongsService, YoutubeService, LyricsService, GeminiService, StreamService],
  exports: [SongsService, YoutubeService, LyricsService, GeminiService, StreamService],
})
export class SongsModule {}
