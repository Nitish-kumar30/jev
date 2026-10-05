/**
 * Express routes for Live mode. No listen() here.
 *
 * Local `npm run server` listens in index.js. Vercel imports this app from
 * api/index.js and invokes it as a serverless function. The OpenRouter key
 * is read from the environment at request time, never from the browser.
 */
import express from 'express';
import cors from 'cors';
import { hasJevKey, jevClassify, jevGate, jevRoute } from './adapters/jev.js';
import { hasLlmKey, llmAnswer, llmClassify, routerModels } from './adapters/llm.js';
import { openRouterKey, runExample } from './examples.js';
import { detectPii, PII_MAX_CHARS } from './pii.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

/** The frontend calls this before switching to Live mode. */
app.get('/api/health', (req, res) => {
  // routerModels names the two lanes in the Model Router tab (ROUTER_FAST_MODEL / ROUTER_POWERFUL_MODEL).
  res.json({ ok: true, jevKey: hasJevKey(), llmKey: hasLlmKey(), routerModels: routerModels() });
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

app.post('/api/pii', requireKey(() => Boolean(openRouterKey()), 'OPENROUTER_API_KEY'), async (req, res) => {
  const message = asText(req.body?.message);
  if (!message) return res.status(400).json({ error: 'message is required' });
  if (message.length > PII_MAX_CHARS) {
    return res.status(400).json({ error: `message must be ${PII_MAX_CHARS.toLocaleString('en-US')} characters or fewer` });
  }
  try {
    res.json(await detectPii(message));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

const ROUTER_MAX_CHARS = 4000;

const routerRequest = (req, res) => {
  const request = asText(req.body?.request);
  if (!request) {
    res.status(400).json({ error: 'request is required' });
    return null;
  }
  if (request.length > ROUTER_MAX_CHARS) {
    res.status(400).json({ error: `request must be ${ROUTER_MAX_CHARS.toLocaleString('en-US')} characters or fewer` });
    return null;
  }
  return request;
};

app.post('/api/jev/route', requireKey(hasJevKey, 'OPENROUTER_API_KEY'), async (req, res) => {
  const request = routerRequest(req, res);
  if (request === null) return;
  try {
    res.json(await jevRoute(request));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Off by default in the UI: every call here is a real, billed model answer.
app.post('/api/llm/answer', requireKey(hasLlmKey, 'OPENROUTER_API_KEY'), async (req, res) => {
  const request = routerRequest(req, res);
  if (request === null) return;
  const tier = req.body?.tier;
  if (tier !== 'fast' && tier !== 'powerful') {
    return res.status(400).json({ error: "tier must be 'fast' or 'powerful'" });
  }
  try {
    res.json(await llmAnswer(request, tier));
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
