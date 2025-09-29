import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Loki from 'lokijs';
import { Collection } from 'lokijs';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Loki;
  private users: Collection<any>;
  private config: Collection<any>;
  private mediaCache: Collection<any>;

  async onModuleInit() {
    // Database file path - use environment variable for Docker volume mounting
    let dbPath = process.env.DB_PATH || path.join(__dirname, '../../../../../data');
    let dbFile = path.join(dbPath, 'pandora-box.db');
    this.db = new Loki(dbFile, {
      autoload: true,
      autoloadCallback: this.databaseInitialize.bind(this),
      autosave: true,
      autosaveInterval: 5000, // save every 5 seconds
    });
  }

  private databaseInitialize() {
    // Initialize Users collection
    this.users = this.db.getCollection('users');
    if (!this.users) {
      this.users = this.db.addCollection('users', {
        unique: ['username'],
        indices: ['role'],
      });

      // Add default admin user
      this.users.insert({
        username: 'admin',
        password: 'admin', // In production, this should be hashed
        role: 'admin',
        createdAt: new Date(),
        lastLogin: null,
        isActive: true,
      });
    }

    // Initialize Configuration collection
    this.config = this.db.getCollection('config');
    if (!this.config) {
      this.config = this.db.addCollection('config');
    }

    // Initialize MediaCache collection
    this.mediaCache = this.db.getCollection('mediaCache');
    if (!this.mediaCache) {
      this.mediaCache = this.db.addCollection('mediaCache', {
        indices: ['source', 'externalId', 'mediaType'],
      });
    }

    console.log('LokiJS database initialized successfully');
  }

  getUsersCollection(): Collection<any> {
    return this.users;
  }

  getConfigCollection(): Collection<any> {
    return this.config;
  }

  getMediaCacheCollection(): Collection<any> {
    return this.mediaCache;
  }
}