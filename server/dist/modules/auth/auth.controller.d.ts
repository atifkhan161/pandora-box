import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: {
        username: string;
        password: string;
    }): Promise<{
        success: boolean;
        message: string;
        user: {
            username: any;
            role: any;
        };
    }>;
}
