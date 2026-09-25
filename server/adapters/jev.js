/**
 * ============================================================================
 * JEV ADAPTER — this is the one file you edit to go live.
 * ============================================================================
 *
 * Everything TypeSafe-specific lives here: the endpoint URLs, the request
 * body shape, and how to read the response. The rest of the app only ever
 * sees the normalised shapes returned at the bottom of each function.
 *
 * Fill in the TODOs from TypeSafe's docs. Keys are read from the environment
 * (server/.env) and never leave the server.
 */

const JEV_API_KEY = process.env.JEV_API_KEY;
const JEV_BASE_URL = process.env.JEV_BASE_URL || 'https://api.typesafe.ai/v1';

// TODO: replace with the real model / decision ids from your TypeSafe console.
const JEV_CLASSIFY_MODEL = process.env.JEV_CLASSIFY_MODEL || 'ticket-router-v1';
const JEV_GATE_MODEL = process.env.JEV_GATE_MODEL || 'action-gate-v1';

export const hasJevKey = () => Boolean(JEV_API_KEY);

async function callJev(path, body) {
  const started = Date.now();

  // TODO: confirm the auth header TypeSafe expects. Common options:
  //   Authorization: `Bearer ${JEV_API_KEY}`   (assumed below)
  //   x-api-key: JEV_API_KEY
  const res = await fetch(`${JEV_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JEV_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Jev API ${res.status}: ${detail.slice(0, 300)}`);
  }
  return { data: await res.json(), latencyMs: Date.now() - started };
}

/**
 * Classify one support message into Billing | Technical | Refund | Spam.
 *
 * @returns {Promise<{label: string, confidence: number, latencyMs: number, cost?: number}>}
 */
export async function jevClassify(message) {
  // TODO: replace the path and body with TypeSafe's classification request.
  //   e.g. POST /decisions  { model, input, labels }
  const { data, latencyMs } = await callJev('/decisions', {
    model: JEV_CLASSIFY_MODEL,
    input: message,
    labels: ['Billing', 'Technical', 'Refund', 'Spam'],
  });

  // TODO: map the real response fields. The app needs a label plus a 0..1
  // confidence; anything below 0.7 is routed to a human by the frontend.
  return {
    label: data.decision ?? data.label,
    confidence: data.confidence ?? data.probability ?? null,
    latencyMs,
    cost: data.cost, // optional; falls back to the constant in the frontend
  };
}

/**
 * Judge whether an agent may perform an action.
 *
 * IMPORTANT: `fetchedContent` is deliberately optional and off by default.
 * Sending content the agent fetched lets that content influence the gate —
 * that is exactly the risk the second tab demonstrates. Keep it out unless
 * you are illustrating the failure mode.
 *
 * @returns {Promise<{decision: 'allow'|'ask'|'block', confidence: number, reason: string}>}
 */
export async function jevGate(action, fetchedContent) {
  // TODO: replace with TypeSafe's gate/policy request shape.
  const { data, latencyMs } = await callJev('/gate', {
    model: JEV_GATE_MODEL,
    action,
    ...(fetchedContent ? { context: fetchedContent } : {}),
  });

  // TODO: map the real fields, and map whatever verdict vocabulary the API
  // uses onto 'allow' | 'ask' | 'block'.
  return {
    decision: data.decision ?? data.verdict,
    confidence: data.confidence ?? null,
    reason: data.reason ?? data.explanation ?? '',
    latencyMs,
  };
}
