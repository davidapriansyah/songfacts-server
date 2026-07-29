import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  email?: string;
  roomCode?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomGateway.name);

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Client connected without token, disconnecting');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.email = payload.email;

      this.logger.log(`Client connected: ${client.email} (${client.id})`);
    } catch (error) {
      this.logger.warn('Invalid token, disconnecting client');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    // Leave room on disconnect
    if (client.roomCode) {
      client.leave(client.roomCode);
      this.logger.log(`Client left room ${client.roomCode}: ${client.email}`);
    }
    this.logger.log(`Client disconnected: ${client.email || client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomCode: string },
  ) {
    // Leave previous room
    if (client.roomCode) {
      client.leave(client.roomCode);
    }

    client.join(data.roomCode);
    client.roomCode = data.roomCode;
    this.logger.log(`Client joined room ${data.roomCode}: ${client.email}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.roomCode) {
      client.leave(client.roomCode);
      this.logger.log(`Client left room ${client.roomCode}: ${client.email}`);
      client.roomCode = undefined;
    }
  }

  // Broadcast methods called by RoomService
  broadcastToRoom(roomCode: string, event: string, payload: any) {
    this.server.to(roomCode).emit(event, payload);
  }
}
