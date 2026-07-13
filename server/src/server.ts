import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import healthRouter from './routes/health';
import aiRouter from './routes/ai';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Trust proxy: Safely configure Express to read client IP behind Google Cloud Run Load Balancers
// value = 1 trusts the first hop (Cloud Run reverse proxy closest to Express) to avoid IP spoofing
app.set('trust proxy', 1);

// CORS setup: enable only for local development to protect production endpoint
if (process.env.NODE_ENV !== 'production') {
  console.log('[Server] Dev Environment: CORS enabled for developer clients');
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}

// Global body parser with 100kb limit (standard JSON text signals require < 10kb)
app.use(express.json({ limit: '100kb' }));

// Register API Routes
app.use('/api', healthRouter);
app.use('/api/ai', aiRouter);

// Resolve static assets folder robustly based on execution path
const clientDistPath = path.join(__dirname, '../../client/dist');
console.log(`[Server] Static assets directory: ${clientDistPath}`);
app.use(express.static(clientDistPath));

// API 404 handler (placed before wildcard HTML serving, after actual API routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    code: 'API_ROUTE_NOT_FOUND'
  });
});

// Wildcard SPA route handler for client paths: /, /fan, /ops, /ops/simulator
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Fallback error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.type === 'entity.too.large' || err.status === 413 || err.limit) {
    return res.status(413).json({
      error: 'Request payload too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    return res.status(400).json({
      error: 'Invalid JSON request payload',
      code: 'INVALID_JSON_PAYLOAD'
    });
  }
  console.error('[Server] Unhandled Exception:', err);
  res.status(500).json({
    error: 'Internal server error occurred',
    code: 'INTERNAL_SERVER_ERROR'
  });
});

// Listen on the port assigned by Cloud Run, binding to 0.0.0.0 interface
app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(` StadiumPulse AI Server Online`);
  console.log(` Running on port: http://0.0.0.0:${PORT}`);
  console.log(`========================================`);
});
