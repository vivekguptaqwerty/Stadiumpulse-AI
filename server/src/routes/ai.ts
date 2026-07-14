import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { geminiClient } from '../ai/geminiClient';
import { stadiumDataService } from '../services/stadiumDataService';

const router = Router();

// Rate Limiters: 429 JSON responses
const fanLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: () => Number(process.env.FAN_AI_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'AI request limit reached',
      code: 'AI_RATE_LIMITED',
      retryAfterSeconds: 600
    });
  }
});

const opsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: () => Number(process.env.OPS_AI_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'AI request limit reached',
      code: 'AI_RATE_LIMITED',
      retryAfterSeconds: 600
    });
  }
});

// Deterministic Request Validators
const validateFanRequest = (req: any, res: any, next: any) => {
  const { message, fanContext } = req.body;

  if (message === undefined || typeof message !== 'string') {
    return res.status(400).json({
      error: 'Invalid fan assistant request: message is required and must be a string',
      code: 'INVALID_AI_REQUEST'
    });
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({
      error: 'Invalid fan assistant request: message cannot be empty',
      code: 'INVALID_AI_REQUEST'
    });
  }

  if (trimmed.length > 1000) {
    return res.status(400).json({
      error: 'Invalid fan assistant request: message length exceeds 1000 characters limit',
      code: 'INVALID_AI_REQUEST'
    });
  }

  if (!fanContext || typeof fanContext !== 'object') {
    return res.status(400).json({
      error: 'Invalid fan assistant request: fanContext object is required',
      code: 'INVALID_AI_REQUEST'
    });
  }

  const requiredFields = ['stadiumName', 'currentLocation', 'level', 'seatDetails', 'username'];
  for (const field of requiredFields) {
    if (fanContext[field] === undefined || typeof fanContext[field] !== 'string') {
      return res.status(400).json({
        error: `Invalid fan assistant request: fanContext.${field} must be a string`,
        code: 'INVALID_AI_REQUEST'
      });
    }
  }

  next();
};

const validateOpsRequest = (req: any, res: any, next: any) => {
  const snapshot = req.body;

  if (!snapshot || typeof snapshot !== 'object') {
    return res.status(400).json({
      error: 'Invalid operations request: snapshot body is required',
      code: 'INVALID_AI_REQUEST'
    });
  }

  if (!Array.isArray(snapshot.gates) || !Array.isArray(snapshot.zones) || !Array.isArray(snapshot.incidents)) {
    return res.status(400).json({
      error: 'Invalid operations request: gates, zones, and incidents must be arrays',
      code: 'INVALID_AI_REQUEST'
    });
  }

  if (snapshot.activeScenario !== undefined && typeof snapshot.activeScenario !== 'string') {
    return res.status(400).json({
      error: 'Invalid operations request: activeScenario must be a string',
      code: 'INVALID_AI_REQUEST'
    });
  }

  next();
};

// POST /api/ai/fan-assistant
router.post('/fan-assistant', fanLimiter, validateFanRequest, async (req, res) => {
  const { message, fanContext, stadiumState } = req.body;

  try {
    // Stage 1: Classifier
    const classification = await geminiClient.classifyFanRequest(message);

    // Stage 2: Context resolver (passing live stadiumState for closed-loop grounding)
    const resolvedContext = stadiumDataService.resolveContext(
      classification.intent, 
      fanContext?.preferredLanguage || 'en',
      stadiumState
    );

    // Stage 3: Grounded responder
    const fanResponse = await geminiClient.generateGroundedFanResponse(
      message,
      classification,
      resolvedContext.facilities
    );

    res.json(fanResponse);
  } catch (err) {
    console.error('[Routes] Fan Assistant pipeline error:', err);
    res.status(500).json({
      error: 'Internal AI pipeline failure',
      code: 'INTERNAL_AI_FAILURE'
    });
  }
});

// POST /api/ai/operations/analyze
router.post('/operations/analyze', opsLimiter, validateOpsRequest, async (req, res) => {
  const snapshot = req.body;

  try {
    const analysis = await geminiClient.analyzeOperationsSnapshot(snapshot);
    res.json(analysis);
  } catch (err) {
    console.error('[Routes] Ops analysis pipeline error:', err);
    res.status(500).json({
      error: 'Internal operations analysis failure',
      code: 'INTERNAL_AI_FAILURE'
    });
  }
});

export default router;
