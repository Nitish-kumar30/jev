/**
 * ============================================================================
 * LLM ADAPTER — the chatbot side of the comparison.
 * ============================================================================
 *
 * Defaults to the Anthropic Messages API. Swap the URL, headers and body for
 * any other provider; only this file needs to change.
 */

const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.anthropic.com/v1/messages';
const LLM_MODEL = process.env.LLM_MODEL || 'claude-haiku-4-5-20251001';

export const hasLlmKey = () => Boolean(LLM_API_KEY);

const PROMPT = `Classify the support message into exactly one of:
Billing, Technical, Refund, Spam.
Reply with the single word only, no punctuation or explanation.

Message: `;

/**
 * Classify one support message with a text-generating model.
 *
 * @returns {Promise<{label: string, confidence: null, latencyMs: number}>}
 */
export async function llmClassify(message) {
  const started = Date.now();

  // TODO: adjust if you point this at a provider other than Anthropic.
  const res = await fetch(LLM_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LLM_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: 8,
      messages: [{ role: 'user', content: PROMPT + message }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LLM API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = (data.content?.[0]?.text ?? '').trim();
  const label = ['Billing', 'Technical', 'Refund', 'Spam'].find(
    (l) => l.toLowerCase() === raw.toLowerCase()
  );

  return {
    // A text model can reply with anything; fall back rather than crash.
    label: label ?? 'Technical',
    // Deliberately null: this is the point of the comparison. A chatbot's
    // prose does not carry a calibrated probability.
    confidence: null,
    latencyMs: Date.now() - started,
  };
}
