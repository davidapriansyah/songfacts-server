import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
interface AuthenticatedSocket extends Socket {
    userId?: number;
    email?: string;
    roomCode?: string;
}
export declare class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleJoinRoom(client: AuthenticatedSocket, data: {
        roomCode: string;
    }): void;
    handleLeaveRoom(client: AuthenticatedSocket): void;
    broadcastToRoom(roomCode: string, event: string, payload: any): void;
}
export {};
