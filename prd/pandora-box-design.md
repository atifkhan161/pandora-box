# Detailed Design Document: Pandora Progressive Web Application

## Document Information

**Project Name:** Pandora Progressive Web Application  
**Document Author:** Development Team  
**Date Created:** September 15, 2025  
**Last Updated:** September 15, 2025  
**Version:** 1.0  
**Document Type:** Technical Design Document  

---

## 1. Introduction and Overview

### 1.1 Purpose

This document provides detailed technical specifications for implementing Pandora PWA, a mobile-first, self-hosted Progressive Web Application that unifies media discovery, download management, file operations, container control, and media server updates[web:19][web:21].

### 1.2 Project Summary

Pandora consolidates multiple Dockerized services into a single responsive, installable interface with contemporary modern dark theming. The application serves as the central control point for managing media APIs, torrent download pipelines, Samba file shares, Docker container status, and Jellyfin media library updates[web:19][web:21].

### 1.3 Scope

This design covers the complete system architecture, component specifications, API design, database schema, security considerations, and deployment architecture for the Pandora PWA system[web:19][web:21].

---

## 2. System Architecture

### 2.1 High-Level Architecture

The system follows a **modular monolith** architecture with clear separation of concerns across multiple layers[web:40][web:41]:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │        Progressive Web Application                  │ │
│  │    (Vanilla JS, HTML, CSS Variables)                │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WSS
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            NestJS Application                       │ │
│  │        (TypeScript, Modular Architecture)           │ │
│  │                                                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │ │
│  │  │   Auth   │ │   API    │ │   File   │ │ Docker  │ │ │
│  │  │ Module   │ │  Proxy   │ │ Manager  │ │ Control │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   DATA LAYER                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              LokiJS Database                        │ │
│  │         (Embedded NoSQL Database)                   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                EXTERNAL SERVICES                        │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐   │
│  │   TMDB   │ │Watchmode │ │  Jackett  │ │qBittorrent│   │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐                │
│  │CloudCmd  │ │Portainer │ │  Jellyfin │                │
│  └──────────┘ └──────────┘ └───────────┘                │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Architectural Patterns

#### 2.2.1 NestJS Modular Architecture

The backend follows NestJS architectural principles with clear module boundaries[web:39][web:41]:

- **Modules**: Feature-based modules (Auth, Media, Files, Docker, etc.)
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and external API interactions
- **Providers**: Dependency injection for shared services
- **Guards**: Authentication and authorization
- **Interceptors**: Request/response transformation and logging

#### 2.2.2 Domain-Driven Design (DDD)

Each module represents a distinct domain within the media management ecosystem[web:40]:

```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── jwt.strategy.ts
│   └── dto/
├── media/
│   ├── media.controller.ts
│   ├── media.service.ts
│   ├── media.module.ts
│   └── dto/
├── downloads/
│   ├── downloads.controller.ts
│   ├── downloads.service.ts
│   ├── downloads.gateway.ts
│   └── downloads.module.ts
├── files/
│   ├── files.controller.ts
│   ├── files.service.ts
│   └── files.module.ts
└── docker/
    ├── docker.controller.ts
    ├── docker.service.ts
    └── docker.module.ts
```

---

## 3. Component Design

### 3.1 Frontend Components (PWA Layer)

#### 3.1.1 Application Shell

**Purpose**: Provides the core PWA structure with navigation, authentication state, and theme management.

**Key Features**:
- Service Worker registration
- App installation prompts
- Offline capability
- Theme switching (CSS variables)
- Navigation routing

**Technology Stack**:
- Vanilla JavaScript (ES6+ modules)
- CSS Grid/Flexbox for responsive layout
- CSS Custom Properties for theming
- Web Components for reusable UI elements

#### 3.1.2 Authentication Component

**Responsibilities**:
- Login form handling
- JWT token management in IndexedDB
- Session persistence
- Role-based UI rendering

#### 3.1.3 Dashboard Component

**Responsibilities**:
- Media discovery interface
- Category-based content display
- Search functionality
- Download initiation

#### 3.1.4 Downloads Manager Component

**Responsibilities**:
- Real-time download status display
- WebSocket connection management
- Download control actions (pause/resume/cancel)
- Progress visualization

#### 3.1.5 File Browser Component

**Responsibilities**:
- Samba share navigation
- File operations interface
- Breadcrumb navigation
- File action controls

### 3.2 Backend Components (NestJS Layer)

#### 3.2.1 Authentication Module

```typescript
// auth.module.ts
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '90d' },
    }),
    DatabaseModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthGuard],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
```

**Components**:
- **AuthController**: Login, logout, token refresh endpoints
- **AuthService**: User validation, JWT generation, session management
- **JwtStrategy**: Passport JWT strategy implementation
- **AuthGuard**: Route protection and role validation

#### 3.2.2 Media Discovery Module

```typescript
// media.module.ts
@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    TmdbService,
    WatchmodeService
  ],
  exports: [MediaService]
})
export class MediaModule {}
```

**Components**:
- **MediaController**: RESTful endpoints for media search and discovery
- **MediaService**: Business logic for media aggregation and caching
- **TmdbService**: TMDB API proxy and data transformation
- **WatchmodeService**: Watchmode API proxy and streaming data

#### 3.2.3 Downloads Module

```typescript
// downloads.module.ts
@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [DownloadsController],
  providers: [
    DownloadsService,
    JackettService,
    QbittorrentService,
    DownloadsGateway
  ],
  exports: [DownloadsService]
})
export class DownloadsModule {}
```

**Components**:
- **DownloadsController**: Download management endpoints
- **DownloadsService**: Torrent lifecycle management
- **JackettService**: Torrent search proxy
- **QbittorrentService**: Download client integration
- **DownloadsGateway**: WebSocket gateway for real-time updates

#### 3.2.4 Files Module

**Components**:
- **FilesController**: File operation endpoints
- **FilesService**: Samba integration and file management
- **CloudCommanderService**: CloudCmd API proxy

#### 3.2.5 Docker Module

**Components**:
- **DockerController**: Container management endpoints
- **DockerService**: Container lifecycle operations
- **PortainerService**: Portainer API proxy

---

## 4. Database Design

### 4.1 LokiJS Schema Design

LokiJS collections for persistent data storage[web:19][web:20]:

#### 4.1.1 Users Collection

```javascript
// Users collection schema
const usersSchema = {
  id: { type: 'string', unique: true },
  username: { type: 'string', unique: true },
  passwordHash: { type: 'string' },
  role: { type: 'string', enum: ['admin', 'team'] },
  createdAt: { type: 'date' },
  lastLogin: { type: 'date' },
  isActive: { type: 'boolean' }
};
```

#### 4.1.2 Sessions Collection

```javascript
// Sessions collection schema
const sessionsSchema = {
  id: { type: 'string', unique: true },
  userId: { type: 'string' },
  token: { type: 'string' },
  expiresAt: { type: 'date' },
  createdAt: { type: 'date' },
  lastAccessed: { type: 'date' }
};
```

#### 4.1.3 Media Cache Collection

```javascript
// Media cache collection schema
const mediaCacheSchema = {
  id: { type: 'string', unique: true },
  source: { type: 'string', enum: ['tmdb', 'watchmode'] },
  mediaType: { type: 'string', enum: ['movie', 'tv'] },
  externalId: { type: 'string' },
  title: { type: 'string' },
  metadata: { type: 'object' },
  cachedAt: { type: 'date' },
  expiresAt: { type: 'date' }
};
```

#### 4.1.4 Downloads Collection

```javascript
// Downloads collection schema
const downloadsSchema = {
  id: { type: 'string', unique: true },
  torrentHash: { type: 'string' },
  title: { type: 'string' },
  status: { type: 'string', enum: ['queued', 'downloading', 'completed', 'failed'] },
  progress: { type: 'number' },
  downloadSpeed: { type: 'number' },
  eta: { type: 'number' },
  createdAt: { type: 'date' },
  completedAt: { type: 'date' }
};
```

#### 4.1.5 Configuration Collection

```javascript
// Configuration collection schema
const configurationSchema = {
  key: { type: 'string', unique: true },
  value: { type: 'string' },
  encrypted: { type: 'boolean' },
  updatedAt: { type: 'date' },
  updatedBy: { type: 'string' }
};
```

### 4.2 Database Service Layer

```typescript
// database.service.ts
@Injectable()
export class DatabaseService {
  private db: Loki;
  private users: Collection<User>;
  private sessions: Collection<Session>;
  private mediaCache: Collection<MediaCache>;
  private downloads: Collection<Download>;
  private configuration: Collection<Configuration>;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    this.db = new Loki('pandora.db', {
      persistenceMethod: 'fs',
      autoload: true,
      autoloadCallback: this.databaseInitialize.bind(this),
      autosave: true,
      autosaveInterval: 4000
    });
  }

  private databaseInitialize() {
    this.users = this.db.getCollection('users') || this.db.addCollection('users');
    this.sessions = this.db.getCollection('sessions') || this.db.addCollection('sessions');
    this.mediaCache = this.db.getCollection('mediaCache') || this.db.addCollection('mediaCache');
    this.downloads = this.db.getCollection('downloads') || this.db.addCollection('downloads');
    this.configuration = this.db.getCollection('configuration') || this.db.addCollection('configuration');
  }
}
```

---

## 5. API Design

### 5.1 RESTful API Endpoints

#### 5.1.1 Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/auth/login` | User authentication | `{ username, password, rememberMe }` | `{ token, user, expiresIn }` |
| POST | `/api/v1/auth/logout` | Session termination | `{ token }` | `{ success }` |
| POST | `/api/v1/auth/refresh` | Token refresh | `{ refreshToken }` | `{ token, expiresIn }` |
| GET | `/api/v1/auth/profile` | User profile | - | `{ user }` |

#### 5.1.2 Media Discovery Endpoints

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| GET | `/api/v1/media/trending` | Trending media | `type, page, limit` | `{ results, pagination }` |
| GET | `/api/v1/media/search` | Search media | `query, type, page` | `{ results, pagination }` |
| GET | `/api/v1/media/details/:id` | Media details | `id, source` | `{ media, streaming }` |
| GET | `/api/v1/media/categories` | Available categories | - | `{ categories }` |

#### 5.1.3 Downloads Management Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/v1/downloads` | List downloads | - | `{ downloads }` |
| POST | `/api/v1/downloads/search` | Search torrents | `{ query, category }` | `{ torrents }` |
| POST | `/api/v1/downloads/add` | Add torrent | `{ magnetLink, title }` | `{ download }` |
| PUT | `/api/v1/downloads/:id/pause` | Pause download | - | `{ success }` |
| PUT | `/api/v1/downloads/:id/resume` | Resume download | - | `{ success }` |
| DELETE | `/api/v1/downloads/:id` | Remove download | - | `{ success }` |

#### 5.1.4 File Management Endpoints

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| GET | `/api/v1/files/list` | List directory | `path` | `{ files, directories }` |
| POST | `/api/v1/files/move` | Move file | `{ source, destination }` | `{ success }` |
| POST | `/api/v1/files/copy` | Copy file | `{ source, destination }` | `{ success }` |
| DELETE | `/api/v1/files/:path` | Delete file | - | `{ success }` |

#### 5.1.5 Docker Management Endpoints

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| GET | `/api/v1/docker/containers` | List containers | - | `{ containers }` |
| GET | `/api/v1/docker/stacks` | List stacks | - | `{ stacks }` |
| POST | `/api/v1/docker/containers/:id/restart` | Restart container | - | `{ success }` |
| GET | `/api/v1/docker/containers/:id/logs` | Container logs | `lines` | `{ logs }` |

### 5.2 WebSocket Events

#### 5.2.1 Downloads Gateway

**Namespace**: `/downloads`

**Events**:
- `download_progress`: Real-time download progress updates
- `download_completed`: Download completion notification
- `download_failed`: Download failure notification
- `torrent_added`: New torrent added notification

**Example Event Structure**:
```typescript
interface DownloadProgressEvent {
  downloadId: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  eta: number;
  status: 'downloading' | 'seeding' | 'paused';
}
```

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

#### 6.1.1 JWT Token Strategy

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

#### 6.1.2 Role-Based Access Control (RBAC)

```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### 6.2 Data Protection

#### 6.2.1 Configuration Encryption

```typescript
// encryption.service.ts
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('pandora', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('pandora', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 6.3 API Security Measures

- **Rate Limiting**: Throttle API requests to prevent abuse
- **CORS Configuration**: Restrict cross-origin requests
- **Input Validation**: Validate all incoming data using DTOs
- **SQL Injection Prevention**: Parameterized queries and input sanitization
- **XSS Protection**: Content Security Policy headers

---

## 7. Performance Considerations

### 7.1 Caching Strategy

#### 7.1.1 Media Metadata Caching

```typescript
// media.service.ts
@Injectable()
export class MediaService {
  constructor(
    private databaseService: DatabaseService,
    private tmdbService: TmdbService
  ) {}

  async getMediaDetails(id: string, source: 'tmdb' | 'watchmode'): Promise<Media> {
    // Check cache first
    const cached = await this.databaseService.getMediaCache(id, source);
    
    if (cached && cached.expiresAt > new Date()) {
      return cached.metadata;
    }

    // Fetch from external API
    const media = await this.tmdbService.getDetails(id);
    
    // Cache for 24 hours
    await this.databaseService.setMediaCache(id, source, media, 24 * 60 * 60 * 1000);
    
    return media;
  }
}
```

### 7.2 Database Optimization

#### 7.2.1 LokiJS Indexing

```typescript
// database.service.ts
private setupIndexes() {
  // Index frequently queried fields
  this.users.ensureIndex('username');
  this.sessions.ensureIndex('userId');
  this.mediaCache.ensureIndex(['source', 'externalId']);
  this.downloads.ensureIndex('status');
  this.configuration.ensureIndex('key');
}
```

### 7.3 Frontend Performance

#### 7.3.1 Service Worker Implementation

```javascript
// service-worker.js
const CACHE_NAME = 'pandora-v1';
const STATIC_CACHE = [
  '/',
  '/css/app.css',
  '/js/app.js',
  '/images/icons/',
  '/fonts/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
```

---

## 8. Deployment Architecture

### 8.1 Docker Configuration

#### 8.1.1 Application Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs && \
    adduser -S pandora -u 1001

WORKDIR /app
COPY --from=builder --chown=pandora:nodejs /app/dist ./dist
COPY --from=builder --chown=pandora:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=pandora:nodejs /app/package*.json ./

USER pandora

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

#### 8.1.2 Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  pandora:
    build: .
    container_name: pandora-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - pandora-network
    depends_on:
      - cloud-commander
      - portainer

  cloud-commander:
    image: coderaiser/cloudcmd:latest
    container_name: pandora-cloudcmd
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - /media:/media
    networks:
      - pandora-network

  portainer:
    image: portainer/portainer-ce:latest
    container_name: pandora-portainer
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - pandora-network

networks:
  pandora-network:
    driver: bridge

volumes:
  portainer_data:
```

### 8.2 Environment Configuration

#### 8.2.1 Environment Variables

```bash
# .env
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=your-super-secure-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data

# External APIs
TMDB_API_KEY=your-tmdb-api-key
WATCHMODE_API_KEY=your-watchmode-api-key

# Internal Service URLs
JACKETT_URL=http://localhost:9117
QBITTORRENT_URL=http://localhost:8080
CLOUD_COMMANDER_URL=http://localhost:8000
PORTAINER_URL=http://localhost:9000
JELLYFIN_URL=http://localhost:8096

# Database
DB_PATH=./data/pandora.db
DB_AUTO_SAVE=true
DB_AUTO_SAVE_INTERVAL=4000
```

---

## 9. Testing Strategy

### 9.1 Unit Testing

#### 9.1.1 Service Testing Example

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: {
            findUser: jest.fn(),
            createSession: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = { id: '1', username: 'admin', passwordHash: 'hashed' };
      jest.spyOn(databaseService, 'findUser').mockResolvedValue(mockUser);

      const result = await service.validateUser('admin', 'password');
      expect(result).toEqual(mockUser);
    });
  });
});
```

### 9.2 Integration Testing

#### 9.2.1 API Endpoint Testing

```typescript
// media.controller.e2e-spec.ts
describe('MediaController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/media/trending (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/media/trending')
      .expect(200)
      .expect((res) => {
        expect(res.body.results).toBeDefined();
        expect(Array.isArray(res.body.results)).toBe(true);
      });
  });
});
```

---

## 10. Monitoring and Logging

### 10.1 Application Logging

```typescript
// logger.service.ts
@Injectable()
export class LoggerService {
  private logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
  });

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }
}
```

### 10.2 Health Checks

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkExternalServices(),
    ]);
  }

  private async checkExternalServices(): Promise<HealthIndicatorResult> {
    // Check external API availability
    const services = ['tmdb', 'watchmode', 'jackett', 'qbittorrent'];
    const results = await Promise.allSettled(
      services.map(service => this.pingService(service))
    );
    
    return {
      external_services: {
        status: results.every(r => r.status === 'fulfilled') ? 'up' : 'down',
        details: results
      }
    };
  }
}
```

---

## 11. Future Enhancements

### 11.1 Planned Features

- **Subtitle Management**: Integration with Bazarr for automated subtitle downloads
- **Transcoding Monitoring**: Real-time media transcoding status and control
- **AI Recommendations**: Machine learning-based content recommendation engine
- **Mobile Applications**: Native iOS and Android companion apps
- **Multi-Instance Support**: Federation across multiple Pandora instances

### 11.2 Scalability Considerations

- **Microservices Migration**: Potential migration to microservices architecture
- **External Database**: Migration to PostgreSQL or MongoDB for larger datasets
- **Caching Layer**: Redis implementation for improved performance
- **Load Balancing**: Multiple instance deployment with load balancer

---

## 12. Appendices

### 12.1 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | Vanilla JavaScript | ES2020+ | User interface |
| Frontend | CSS Variables | CSS3 | Theming system |
| Backend | NestJS | 10.x | Application framework |
| Backend | TypeScript | 5.x | Type safety |
| Database | LokiJS | 1.5.x | Embedded NoSQL database |
| Runtime | Node.js | 18.x | JavaScript runtime |
| Container | Docker | 24.x | Containerization |
| Web Server | Express | 4.x | HTTP server (via NestJS) |

### 12.2 External Service Dependencies

| Service | Purpose | API Version | Documentation |
|---------|---------|-------------|---------------|
| TMDB | Movie/TV metadata | v3 | https://developers.themoviedb.org/ |
| Watchmode | Streaming availability | v1 | https://api.watchmode.com/ |
| Jackett | Torrent indexing | API | https://github.com/Jackett/Jackett |
| qBittorrent | Torrent client | Web API v2 | https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API |
| Cloud Commander | File management | RESTful API | https://cloudcmd.io/ |
| Portainer | Docker management | API 2.0 | https://documentation.portainer.io/api/ |
| Jellyfin | Media server | API v1 | https://api.jellyfin.org/ |

### 12.3 Configuration Reference

Complete configuration options and environment variables are documented in the deployment guide and configuration management documentation.

---

**Document Status**: Complete  
**Review Status**: Pending Review  
**Implementation Status**: Ready for Development
