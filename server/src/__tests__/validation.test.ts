import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Set initial rate limit thresholds to high defaults before importing app
process.env.FAN_AI_RATE_LIMIT_MAX = '1000';
process.env.OPS_AI_RATE_LIMIT_MAX = '1000';

import { app } from '../server';
import { geminiClient } from '../ai/geminiClient';

describe('API Input Validation, Error Handling, and Guardrails', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.FAN_AI_RATE_LIMIT_MAX = '1000';
    process.env.OPS_AI_RATE_LIMIT_MAX = '1000';
  });

  describe('POST /api/ai/fan-assistant Input Validation', () => {
    const validFanContext = {
      stadiumName: 'Lusail Stadium',
      currentLocation: 'Section 118',
      level: 'Level 1',
      seatDetails: 'Row M, Seat 12',
      username: 'Alex'
    };

    it('should return 400 when message is missing', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ fanContext: validFanContext });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_AI_REQUEST');
      expect(res.body.error).toContain('message is required');
    });

    it('should return 400 when message is empty', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ message: '', fanContext: validFanContext });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_AI_REQUEST');
      expect(res.body.error).toContain('cannot be empty');
    });

    it('should return 400 when message is whitespace-only', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ message: '    ', fanContext: validFanContext });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_AI_REQUEST');
    });

    it('should return 400 when message exceeds 1000 characters', async () => {
      const longMessage = 'a'.repeat(1001);
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ message: longMessage, fanContext: validFanContext });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_AI_REQUEST');
      expect(res.body.error).toContain('exceeds 1000 characters');
    });

    it('should return 400 when fanContext is missing', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ message: 'Hello' });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_AI_REQUEST');
      expect(res.body.error).toContain('fanContext object is required');
    });

    it('should return 400 when a required field in fanContext is missing or not a string', async () => {
      const invalidContext = { ...validFanContext, seatDetails: 123 }; // Should be a string
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send({ message: 'Hello', fanContext: invalidContext });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_AI_REQUEST');
      expect(res.body.error).toContain('seatDetails must be a string');
    });
  });

  describe('POST /api/ai/operations/analyze Input Validation', () => {
    it('should return 400 when snapshot is missing', async () => {
      const res = await request(app)
        .post('/api/ai/operations/analyze')
        .send(undefined);
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_AI_REQUEST');
    });

    it('should return 400 when snapshot fields (gates, zones, incidents) are not arrays', async () => {
      const res = await request(app)
        .post('/api/ai/operations/analyze')
        .send({
          gates: 'not-an-array',
          zones: [],
          incidents: []
        });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_AI_REQUEST');
    });
  });

  describe('Malformed JSON Handling', () => {
    it('should return 400 and code INVALID_JSON_PAYLOAD when parsing invalid JSON format', async () => {
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .set('Content-Type', 'application/json')
        .send('{"message": "incomplete JSON ...');
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_JSON_PAYLOAD');
      expect(res.body.error).toContain('Invalid JSON request payload');
    });
  });

  describe('Payload Size Limits', () => {
    it('should return 413 and code PAYLOAD_TOO_LARGE when request size exceeds 100kb limit', async () => {
      const oversizedPayload = 'x'.repeat(101 * 1024); // 101kb
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .set('Content-Type', 'application/json')
        .send({ message: oversizedPayload });
      
      expect(res.status).toBe(413);
      expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('API Rate Limiting', () => {
    it('should rate limit requests and return 429 when the threshold is exceeded', async () => {
      process.env.FAN_AI_RATE_LIMIT_MAX = '3';

      vi.spyOn(geminiClient, 'classifyFanRequest').mockResolvedValue({
        intent: 'NAVIGATION',
        urgency: 'LOW',
        detectedLanguage: 'en',
        needsImmediateAssistance: false,
        requestedFacilityTypes: [],
        accessibilityNeed: false,
        querySummary: 'Testing'
      });
      vi.spyOn(geminiClient, 'generateGroundedFanResponse').mockResolvedValue({
        responseType: 'ROUTE_GUIDANCE',
        title: 'Testing',
        message: 'Normal test path',
        urgency: 'LOW',
        actions: [],
        groundedFacilityIds: [],
        meta: { provider: 'mock', fallbackUsed: true, model: 'gemini-3.5-flash' }
      });

      // Send 3 requests (below or equal to process.env.FAN_AI_RATE_LIMIT_MAX = 3)
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/ai/fan-assistant')
          .set('X-Forwarded-For', '1.2.3.4')
          .send({
            message: 'Testing rate limits',
            fanContext: {
              stadiumName: 'Lusail',
              currentLocation: 'Sec 10',
              level: '1',
              seatDetails: 'A1',
              username: 'Tester'
            }
          });
        expect(res.status).toBe(200);
      }

      // 4th request must trigger rate limit
      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .set('X-Forwarded-For', '1.2.3.4')
        .send({
          message: 'Testing rate limits',
          fanContext: {
            stadiumName: 'Lusail',
            currentLocation: 'Sec 10',
            level: '1',
            seatDetails: 'A1',
            username: 'Tester'
          }
        });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('AI_RATE_LIMITED');
    });

    it('should rate limit operations requests and return 429 when the threshold is exceeded', async () => {
      process.env.OPS_AI_RATE_LIMIT_MAX = '3';
      const validSnapshot = {
        gates: [],
        zones: [],
        incidents: [],
        alerts: [],
        events: [],
        activeScenario: 'NORMAL'
      };

      vi.spyOn(geminiClient, 'analyzeOperationsSnapshot').mockResolvedValue({
        riskDetected: false,
        riskLevel: 'NORMAL',
        title: 'Status Normal',
        summary: 'All checks normal.',
        affectedAreaIds: [],
        observedSignals: [],
        recommendedActions: [],
        reassessmentMinutes: 5,
        meta: { provider: 'mock', fallbackUsed: true, model: 'gemini-3.5-flash' }
      });

      // Send 3 requests (below or equal to process.env.OPS_AI_RATE_LIMIT_MAX = 3)
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/ai/operations/analyze')
          .set('X-Forwarded-For', '5.6.7.8')
          .send(validSnapshot);
        expect(res.status).toBe(200);
      }

      // 4th request must trigger rate limit
      const res = await request(app)
        .post('/api/ai/operations/analyze')
        .set('X-Forwarded-For', '5.6.7.8')
        .send(validSnapshot);

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('AI_RATE_LIMITED');
    });
  });

  describe('Fallback and Gemini Mocking Behavior', () => {
    const validRequest = {
      message: 'Take me to Gate C',
      fanContext: {
        stadiumName: 'Lusail Stadium',
        currentLocation: 'Section 118',
        level: 'Level 1',
        seatDetails: 'Row M, Seat 12',
        username: 'Alex'
      }
    };

    it('should return mock fallback metadata when Gemini pipeline fails', async () => {
      // Mock generateGroundedFanResponse resolving with fallback metadata
      vi.spyOn(geminiClient, 'generateGroundedFanResponse').mockResolvedValueOnce({
        responseType: 'ROUTE_GUIDANCE',
        title: 'Emergency Guidance',
        message: 'Emergency fallback response text.',
        urgency: 'LOW',
        actions: [],
        groundedFacilityIds: [],
        meta: { provider: 'mock', fallbackUsed: true, model: 'gemini-3.5-flash' }
      });

      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send(validRequest);
      
      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual(expect.objectContaining({
        provider: 'mock',
        fallbackUsed: true
      }));
    });

    it('should return gemini metadata when Gemini pipeline succeeds', async () => {
      // Mock successfully resolved response matching schema contract
      vi.spyOn(geminiClient, 'generateGroundedFanResponse').mockResolvedValueOnce({
        responseType: 'ROUTE_GUIDANCE',
        title: 'Route Guidance',
        message: 'Grounded path to Gate C',
        urgency: 'LOW',
        actions: [],
        groundedFacilityIds: ['gate-c'],
        meta: { provider: 'gemini', fallbackUsed: false, model: 'gemini-3.5-flash' }
      });

      const res = await request(app)
        .post('/api/ai/fan-assistant')
        .send(validRequest);
      
      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({
        provider: 'gemini',
        fallbackUsed: false,
        model: 'gemini-3.5-flash'
      });
    });
  });
});
