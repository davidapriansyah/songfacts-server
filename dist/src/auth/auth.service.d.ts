import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(email: string, password: string): Promise<{
        user: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        token: string;
    }>;
    googleLogin(googleId: string, email: string, profileImage?: string): Promise<{
        user: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        token: string;
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        email: string;
        profileImage: string | null;
        createdAt: Date;
    } | null>;
    private generateToken;
}
