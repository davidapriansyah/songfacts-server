import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        token: string;
    }>;
    googleLogin(googleLoginDto: GoogleLoginDto): Promise<{
        user: {
            id: number;
            email: string;
            profileImage: string | null;
        };
        token: string;
    }>;
    getProfile(req: any): Promise<{
        id: number;
        email: string;
        profileImage: string | null;
        createdAt: Date;
    } | null>;
}
