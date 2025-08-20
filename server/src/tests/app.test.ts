import request from 'supertest';
import express from 'express';
import app from '../app';
import * as authRoutes from '../routes/auth';
import * as mediaRoutes from '../routes/media';
import * as downloadsRoutes from '../routes/downloads';
import * as filesRoutes from '../routes/files';
import * as systemRoutes from '../routes/system';
import * as libraryRoutes from '../routes/library';

// Mock dependencies
jest.mock('../routes/auth');
jest.mock('../routes/media');
jest.mock('../routes/downloads');
jest.mock('../routes/files');
jest.mock('../routes/system');
jest.mock('../routes/library');

describe('App', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should respond with 200 for the health check endpoint', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should register all routes', () => {
    // Verify that all route modules were used
    expect(authRoutes.default).toHaveBeenCalled();
    expect(mediaRoutes.default).toHaveBeenCalled();
    expect(downloadsRoutes.default).toHaveBeenCalled();
    expect(filesRoutes.default).toHaveBeenCalled();
    expect(systemRoutes.default).toHaveBeenCalled();
    expect(libraryRoutes.default).toHaveBeenCalled();
  });

  it('should handle 404 errors', async () => {
    const response = await request(app).get('/api/nonexistent-route');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle server errors', async () => {
    // Mock a route that throws an error
    const mockRouter = express.Router();
    mockRouter.get('/error', (req, res, next) => {
      next(new Error('Test error'));
    });
    app.use('/api/test', mockRouter);

    const response = await request(app).get('/api/test/error');
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
});