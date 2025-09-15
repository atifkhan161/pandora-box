import { DatabaseService } from '../database/database.service';
export declare class AuthService {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    validateUser(username: string, password: string): Promise<any>;
}
