import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('Health and AI Status API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 and standard server health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        service: 'stadiumpulse-server'
      });
    });
  });

  describe('GET /api/ai/status', () => {
    it('should return 200 and safe AI configuration metadata without exposing credentials', async () => {
      const res = await request(app).get('/api/ai/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('configured');
      expect(res.body).toHaveProperty('model');
      expect(res.body).toHaveProperty('provider');
      
      // Crucial Security Assertions: Ensure credentials are never leaked
      expect(res.body).not.toHaveProperty('apiKey');
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('GEMINI_API_KEY');
      expect(bodyStr).not.toContain('AI_KEY');
      
      // Ensure the actual API key value is not returned (in case it exists in env)
      if (process.env.GEMINI_API_KEY) {
        expect(bodyStr).not.toContain(process.env.GEMINI_API_KEY);
      }
    });
  });
});
