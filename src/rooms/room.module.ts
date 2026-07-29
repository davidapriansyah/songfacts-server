import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { SongsModule } from '../songs/songs.module';

@Module({
  imports: [
    PrismaModule,
    SongsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomGateway],
  exports: [RoomService, RoomGateway],
})
export class RoomModule {}
