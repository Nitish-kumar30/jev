/**
 * Optional backend for LIVE mode. The frontend works without it.
 *
 * Its only jobs: hold the API keys (they never reach the browser) and
 * forward requests through the adapters in ./adapters.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDir, '.env') });
import { hasJevKey, jevClassify, jevGate } from './adapters/jev.js';
import { hasLlmKey, llmClassify } from './adapters/llm.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

const PORT = process.env.PORT || 8787;

/** The frontend calls this before switching to Live mode. */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, jevKey: hasJevKey(), llmKey: hasLlmKey() });
});

const requireKey = (present, name) => (req, res, next) => {
  if (!present()) {
    return res.status(503).json({
      code: 'missing_key',
      error: `${name} is not set in server/.env — the app will stay in demo mode.`,
    });
  }
  return next();
};

const asText = (value) => (typeof value === 'string' ? value.trim() : '');

app.post('/api/jev/classify', requireKey(hasJevKey, 'OPENROUTER_API_KEY'), async (req, res) => {
  const message = asText(req.body?.message);
  if (!message) return res.status(400).json({ error: 'message is required' });
  try {
    res.json(await jevClassify(message));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/llm/classify', requireKey(hasLlmKey, 'OPENROUTER_API_KEY'), async (req, res) => {
  const message = asText(req.body?.message);
  if (!message) return res.status(400).json({ error: 'message is required' });
  try {
    res.json(await llmClassify(message));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/jev/gate', requireKey(hasJevKey, 'OPENROUTER_API_KEY'), async (req, res) => {
  const action = asText(req.body?.action);
  if (!action) return res.status(400).json({ error: 'action is required' });
  // Only forwarded when the caller explicitly opts in — see the adapter note.
  const fetchedContent = asText(req.body?.fetchedContent) || undefined;
  try {
    res.json(await jevGate(action, fetchedContent));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  console.log(
    `[server] OPENROUTER_API_KEY ${hasJevKey() && hasLlmKey() ? 'set' : 'MISSING'}`
  );
});
