import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Simple logger utility for the application
 */
class Logger {
  private logToFile(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logFile = path.join(logsDir, `${level}.log`);
    const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const logEntry = `[${timestamp}] ${message}${metaStr}\n`;
    
    fs.appendFileSync(logFile, logEntry);
  }

  private formatConsoleMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  /**
   * Log an info message
   */
  info(message: string, meta?: any): void {
    console.log(this.formatConsoleMessage('info', message, meta));
    this.logToFile('info', message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: any): void {
    console.warn(this.formatConsoleMessage('warn', message, meta));
    this.logToFile('warn', message, meta);
  }

  /**
   * Log an error message
   */
  error(message: string, meta?: any): void {
    console.error(this.formatConsoleMessage('error', message, meta));
    this.logToFile('error', message, meta);
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatConsoleMessage('debug', message, meta));
      this.logToFile('debug', message, meta);
    }
  }
}

export const logger = new Logger();