import { Module } from '@nestjs/common';
import { BandsController } from './bands.controller';
import { BandsService } from './bands.service';
import { SongsModule } from '../songs/songs.module';

@Module({
  imports: [SongsModule],
  controllers: [BandsController],
  providers: [BandsService],
})
export class BandsModule {}
