import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async validateUser(username: string, password: string): Promise<any> {
    const usersCollection = this.databaseService.getUsersCollection();
    const user = usersCollection.findOne({ username });

    if (user && user.password === password) {
      // In a real application, we would use a proper password hashing mechanism
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}