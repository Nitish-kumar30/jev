/**
 * Express routes for Live mode. No listen() here.
 *
 * Local `npm run server` listens in index.js. Vercel imports this app from
 * api/index.js and invokes it as a serverless function. The OpenRouter key
 * is read from the environment at request time, never from the browser.
 */
import express from 'express';
import cors from 'cors';
import { hasJevKey, jevClassify, jevGate } from './adapters/jev.js';
import { hasLlmKey, llmClassify } from './adapters/llm.js';
import { openRouterKey, runExample } from './examples.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

/** The frontend calls this before switching to Live mode. */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, jevKey: hasJevKey(), llmKey: hasLlmKey() });
});

const requireKey = (present, name) => (req, res, next) => {
  if (!present()) {
    return res.status(503).json({
      code: 'missing_key',
      error: `${name} is not set — the app will stay in demo mode.`,
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

app.post('/api/examples/:n', requireKey(() => Boolean(openRouterKey()), 'OPENROUTER_API_KEY'), async (req, res) => {
  const n = Number(req.params.n);
  if (!Number.isInteger(n) || n < 1 || n > 6) {
    return res.status(400).json({ error: 'example must be 1–6' });
  }
  try {
    res.json(await runExample(n));
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

export default app;
