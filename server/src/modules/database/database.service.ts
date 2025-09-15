import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Loki from 'lokijs';
import { Collection } from 'lokijs';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Loki;
  private users: Collection<any>;
  private config: Collection<any>;

  async onModuleInit() {
    this.db = new Loki('pandora-box.db', {
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

    console.log('LokiJS database initialized successfully');
  }

  getUsersCollection(): Collection<any> {
    return this.users;
  }

  getConfigCollection(): Collection<any> {
    return this.config;
  }
}