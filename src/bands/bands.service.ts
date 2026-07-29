import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../songs/gemini.service';

@Injectable()
export class BandsService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  async findByName(name: string) {
    let band = await this.prisma.band.findFirst({
      where: { name: { contains: name, mode: 'insensitive' } },
    });

    if (!band) {
      const song = await this.prisma.song.findFirst({
        where: { artist: { contains: name, mode: 'insensitive' } },
      });

      if (song) {
        band = await this.prisma.band.create({
          data: {
            name: song.artist,
            image: song.albumCover,
            genres: song.genres,
          },
        });
      }
    }

    if (!band) {
      throw new NotFoundException('Band not found');
    }

    return band;
  }

  async getTimeline(bandName: string) {
    const band = await this.findByName(bandName);
    const timeline = await this.gemini.generateBandTimeline(band.name);
    return { band, timeline };
  }

  async getDiscography(bandName: string) {
    const band = await this.findByName(bandName);
    const songs = await this.prisma.song.findMany({
      where: { artist: { contains: band.name, mode: 'insensitive' } },
      orderBy: { createdAt: 'asc' },
    });
    return { band, songs };
  }
}
