import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: number) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        song: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: number, songId: number) {
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_songId: { userId, songId },
      },
    });

    if (existing) {
      throw new ConflictException('Song already in favorites');
    }

    return this.prisma.favorite.create({
      data: { userId, songId },
      include: { song: true },
    });
  }

  async remove(userId: number, songId: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_songId: { userId, songId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    if (favorite.userId !== userId) {
      throw new NotFoundException('Not authorized to remove this favorite');
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return { message: 'Favorite removed successfully' };
  }
}
