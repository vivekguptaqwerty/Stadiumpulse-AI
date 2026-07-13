import { Router } from 'express';
import { getAIStatus } from '../ai/geminiClient';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'stadiumpulse-server'
  });
});

router.get('/ai/status', (req, res) => {
  res.json(getAIStatus());
});

export default router;
