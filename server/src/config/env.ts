/**
 * Environment configuration module
 * Provides typed access to environment variables
 */

export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  CORS_ORIGIN: string;
  DB_PATH: string;
  LOG_LEVEL: string;
  TMDB_API_KEY: string;
  JACKETT_API_URL: string;
  JACKETT_API_KEY: string;
  QBITTORRENT_URL: string;
  QBITTORRENT_USERNAME: string;
  QBITTORRENT_PASSWORD: string;
  CLOUD_COMMANDER_URL: string;
  PORTAINER_URL: string;
  JELLYFIN_URL: string;
  JELLYFIN_API_KEY: string;
  DOWNLOAD_PATH: string;
}

/**
 * Get environment variables with defaults
 */
export const getEnv = (): EnvConfig => {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    JWT_SECRET: process.env.JWT_SECRET || 'pandora_box_secret_key',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    DB_PATH: process.env.DB_PATH || './data/pandora.db',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    TMDB_API_KEY: process.env.TMDB_API_KEY || '',
    JACKETT_API_URL: process.env.JACKETT_API_URL || 'http://localhost:9117/api/v2.0',
    JACKETT_API_KEY: process.env.JACKETT_API_KEY || '',
    QBITTORRENT_URL: process.env.QBITTORRENT_URL || 'http://localhost:8080',
    QBITTORRENT_USERNAME: process.env.QBITTORRENT_USERNAME || 'admin',
    QBITTORRENT_PASSWORD: process.env.QBITTORRENT_PASSWORD || 'adminadmin',
    CLOUD_COMMANDER_URL: process.env.CLOUD_COMMANDER_URL || 'http://localhost:8000',
    PORTAINER_URL: process.env.PORTAINER_URL || 'http://localhost:9000',
    JELLYFIN_URL: process.env.JELLYFIN_URL || 'http://localhost:8096',
    JELLYFIN_API_KEY: process.env.JELLYFIN_API_KEY || '',
    DOWNLOAD_PATH: process.env.DOWNLOAD_PATH || './downloads'
  };
};

/**
 * Validate required environment variables
 */
export const validateEnv = (): boolean => {
  const requiredVars = ['JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
};