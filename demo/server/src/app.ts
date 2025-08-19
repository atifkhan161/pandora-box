import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import mediaRoutes from './routes/media';
import downloadRoutes from './routes/downloads';
import fileRoutes from './routes/files';
import dockerRoutes from './routes/docker';
import jellyfinRoutes from './routes/jellyfin';
import settingsRoutes from './routes/settings';

// Import services
import { initializeDatabase } from './services/database';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize database
initializeDatabase();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) }}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (PWA)
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/downloads', downloadRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/docker', dockerRoutes);
app.use('/api/v1/jellyfin', jellyfinRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Serve PWA for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error occurred:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Pandora Box Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

export default app;