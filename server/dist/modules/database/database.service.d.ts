import { OnModuleInit } from '@nestjs/common';
import { Collection } from 'lokijs';
export declare class DatabaseService implements OnModuleInit {
    private db;
    private users;
    private config;
    onModuleInit(): Promise<void>;
    private databaseInitialize;
    getUsersCollection(): Collection<any>;
    getConfigCollection(): Collection<any>;
}
