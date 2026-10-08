import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { generateGeminiRecommendation } from './geminiService';
import { createLogger, describeError } from './logger';
import { parseAiPayload } from './validation';
import {
  calculateVendorScores,
  validateInputs,
  DEFAULT_VENDORS,
  DEFAULT_WEIGHTS,
} from '../src/services/scoringEngine';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = createLogger('server');
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

// Never advertise the framework.
app.disable('x-powered-by');

// Behind a hosting proxy (Render, Railway, Fly, nginx...) every request arrives from the proxy's
// address, so per-IP rate limiting would treat all visitors as one. Set TRUST_PROXY=1 (number of
// proxy hops in front of the app) to use the real client address. Leave unset when running
// without a proxy: trusting the header there would let clients spoof their IP.
const TRUST_PROXY_HOPS = parseInt(process.env.TRUST_PROXY || '0', 10) || 0;
if (TRUST_PROXY_HOPS > 0) app.set('trust proxy', TRUST_PROXY_HOPS);

// ---------------------------------------------------------------------------
// CORS: only the app's own origins may call the API from a browser.
// Extra origins can be added with ALLOWED_ORIGINS=https://a.example,https://b.example
// ---------------------------------------------------------------------------
const allowedOrigins = new Set<string>([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
]);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = same-origin request, dev proxy, curl, or server-to-server.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      log.warn('Blocked cross-origin request', { origin });
      return callback(null, false);
    },
  })
);

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  next();
});

// ---------------------------------------------------------------------------
// Request id + access log. The id is returned in the X-Request-Id header, so a
// failing call in the browser's Network tab can be matched to a server log line.
// ---------------------------------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID().slice(0, 8);
  const started = Date.now();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    if (!req.originalUrl.startsWith('/api')) return; // skip static assets
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log[level](`${req.method} ${req.originalUrl} -> ${res.statusCode}`, {
      requestId,
      ms: Date.now() - started,
    });
  });
  next();
});

// Small body limit: the largest legitimate payload (50 vendors) is a few KB.
app.use(express.json({ limit: '100kb' }));

// ---------------------------------------------------------------------------
// Rate limiting for the endpoint that spends Gemini quota (in-memory, per IP).
// Tune with AI_RATE_LIMIT_PER_MIN (default 10).
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = Math.max(1, parseInt(process.env.AI_RATE_LIMIT_PER_MIN || '10', 10) || 10);
const hits = new Map<string, number[]>();

function aiRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'; // req.ip only reads X-Forwarded-For if TRUST_PROXY is set
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);

  if (recent.length >= RATE_MAX) {
    const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - recent[0])) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    log.warn('AI rate limit hit', { ip, requestId: res.locals.requestId, retryAfter });
    return res.status(429).json({
      success: false,
      isAiGenerated: false,
      error: `Too many analysis requests. Try again in ${retryAfter}s.`,
    });
  }

  recent.push(now);
  hits.set(ip, recent);
  next();
}

// Drop idle entries so the map can't grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) {
    if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

// ---------------------------------------------------------------------------
// 1. Health & Config Status Check
// ---------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VendorWise AI Backend',
  });
});

app.get('/api/config', (_req: Request, res: Response) => {
  const hasServerApiKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
  );
  res.json({
    hasServerApiKey,
    defaultCompany: 'Nova Manufacturing Ltd.',
    defaultWeights: DEFAULT_WEIGHTS,
    defaultVendorCount: DEFAULT_VENDORS.length,
  });
});

// ---------------------------------------------------------------------------
// 2. Deterministic Scoring Endpoint
// ---------------------------------------------------------------------------
app.post('/api/scoring/evaluate', (req: Request, res: Response) => {
  const { vendors, weights } = req.body ?? {};

  if (!Array.isArray(vendors) || vendors.length > 50 || typeof weights !== 'object' || weights === null) {
    return res.status(400).json({
      success: false,
      errors: ['Body must contain a `vendors` array (max 50) and a `weights` object.'],
    });
  }

  try {
    const validation = validateInputs(vendors, weights);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    return res.json({
      success: true,
      rankedVendors: calculateVendorScores(vendors, weights),
      totalWeight: validation.totalWeight,
    });
  } catch (error) {
    log.error('Scoring evaluation failed', {
      requestId: res.locals.requestId,
      ...describeError(error),
    });
    return res.status(500).json({ success: false, error: 'Scoring engine evaluation failed' });
  }
});

// ---------------------------------------------------------------------------
// 3. AI Recommendation & Explanation Endpoint
// ---------------------------------------------------------------------------
app.post('/api/ai/recommendation', aiRateLimit, async (req: Request, res: Response) => {
  const requestId = res.locals.requestId as string;

  const parsed = parseAiPayload(req.body);
  if (!parsed.ok) {
    log.warn('Rejected AI request: invalid payload', { requestId, reason: parsed.error });
    return res.status(400).json({ success: false, error: parsed.error });
  }

  try {
    // generateGeminiRecommendation never throws for Gemini failures (it falls back to the
    // rule engine); the catch below is for genuinely unexpected bugs.
    const recommendation = await generateGeminiRecommendation(
      parsed.payload,
      log.child(`ai:${requestId}`)
    );
    return res.json(recommendation);
  } catch (error) {
    log.error('Unexpected failure in AI recommendation', { requestId, ...describeError(error) });
    return res.status(500).json({
      success: false,
      isAiGenerated: false,
      error:
        'AI explanation is temporarily unavailable. The vendor ranking is still available based on the configured scoring model.',
    });
  }
});

// Unknown API routes get a JSON 404 instead of falling through to the SPA's index.html.
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// ---------------------------------------------------------------------------
// 4. Serve Static Frontend in Production / Built mode
// ---------------------------------------------------------------------------
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ---------------------------------------------------------------------------
// Central error handler: malformed JSON, oversized bodies, anything unexpected.
// Never leaks stack traces or internal messages to the client.
// ---------------------------------------------------------------------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const requestId = res.locals.requestId;
  if (err?.type === 'entity.too.large') {
    log.warn('Request body too large', { requestId });
    return res.status(413).json({ success: false, error: 'Request body too large' });
  }
  if (err?.type === 'entity.parse.failed') {
    log.warn('Malformed JSON body', { requestId });
    return res.status(400).json({ success: false, error: 'Malformed JSON body' });
  }
  log.error('Unhandled server error', { requestId, ...describeError(err) });
  return res.status(500).json({ success: false, error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled promise rejection', describeError(reason));
});
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', describeError(error));
});

app.listen(PORT, () => {
  log.info(`Server running on http://localhost:${PORT}`);
  log.info(
    `Gemini API key configured: ${process.env.GEMINI_API_KEY?.trim() ? 'YES (Active)' : 'NO (Using Rule Engine Fallback)'}`
  );
  log.info(`Gemini model: ${process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite (default)'}`, {
    logLevel: process.env.LOG_LEVEL || 'info',
    rateLimitPerMin: RATE_MAX,
    trustProxyHops: TRUST_PROXY_HOPS,
  });
});
