"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const Loki = require("lokijs");
let DatabaseService = class DatabaseService {
    async onModuleInit() {
        this.db = new Loki('pandora-box.db', {
            autoload: true,
            autoloadCallback: this.databaseInitialize.bind(this),
            autosave: true,
            autosaveInterval: 5000,
        });
    }
    databaseInitialize() {
        this.users = this.db.getCollection('users');
        if (!this.users) {
            this.users = this.db.addCollection('users', {
                unique: ['username'],
                indices: ['role'],
            });
            this.users.insert({
                username: 'admin',
                password: 'admin',
                role: 'admin',
                createdAt: new Date(),
                lastLogin: null,
                isActive: true,
            });
        }
        this.config = this.db.getCollection('config');
        if (!this.config) {
            this.config = this.db.addCollection('config');
        }
        console.log('LokiJS database initialized successfully');
    }
    getUsersCollection() {
        return this.users;
    }
    getConfigCollection() {
        return this.config;
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)()
], DatabaseService);
//# sourceMappingURL=database.service.js.map