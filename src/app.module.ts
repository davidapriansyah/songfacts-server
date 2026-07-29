import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { SongsModule } from './songs/songs.module';
import { BandsModule } from './bands/bands.module';
import { FavoritesModule } from './favorites/favorites.module';
import { RoomModule } from './rooms/room.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    SongsModule,
    BandsModule,
    FavoritesModule,
    RoomModule,
  ],
})
export class AppModule {}
