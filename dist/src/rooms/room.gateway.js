"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RoomGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
let RoomGateway = RoomGateway_1 = class RoomGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(RoomGateway_1.name);
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
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
        }
        catch (error) {
            this.logger.warn('Invalid token, disconnecting client');
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        // Leave room on disconnect
        if (client.roomCode) {
            client.leave(client.roomCode);
            this.logger.log(`Client left room ${client.roomCode}: ${client.email}`);
        }
        this.logger.log(`Client disconnected: ${client.email || client.id}`);
    }
    handleJoinRoom(client, data) {
        // Leave previous room
        if (client.roomCode) {
            client.leave(client.roomCode);
        }
        client.join(data.roomCode);
        client.roomCode = data.roomCode;
        this.logger.log(`Client joined room ${data.roomCode}: ${client.email}`);
    }
    handleLeaveRoom(client) {
        if (client.roomCode) {
            client.leave(client.roomCode);
            this.logger.log(`Client left room ${client.roomCode}: ${client.email}`);
            client.roomCode = undefined;
        }
    }
    // Broadcast methods called by RoomService
    broadcastToRoom(roomCode, event, payload) {
        this.server.to(roomCode).emit(event, payload);
    }
};
exports.RoomGateway = RoomGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RoomGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RoomGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoomGateway.prototype, "handleLeaveRoom", null);
exports.RoomGateway = RoomGateway = RoomGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], RoomGateway);
//# sourceMappingURL=room.gateway.js.map