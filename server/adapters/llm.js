/**
 * Chatbot side of the comparison, via OpenRouter chat completions.
 *
 * This is a normal text model. Jev does not use this endpoint.
 */

const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

const llmKey = () => process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY;
const llmModel = () => process.env.LLM_MODEL || 'openai/gpt-4o-mini';

export const hasLlmKey = () => Boolean(llmKey());

const PROMPT = `Classify the support message into exactly one of:
Billing, Technical, Refund, Spam.
Reply with the single word only, no punctuation or explanation.

Message: `;

function readText(content) {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }
  return '';
}

/**
 * Classify one support message with a text-generating model.
 *
 * @returns {Promise<{label: string, confidence: null, latencyMs: number}>}
 */
export async function llmClassify(message) {
  const started = Date.now();

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${llmKey()}`,
    },
    body: JSON.stringify({
      model: llmModel(),
      max_tokens: 8,
      messages: [{ role: 'user', content: PROMPT + message }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LLM API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = readText(data.choices?.[0]?.message?.content);
  const label = ['Billing', 'Technical', 'Refund', 'Spam'].find(
    (name) => name.toLowerCase() === raw.toLowerCase()
  );

  return {
    label: label ?? 'Technical',
    confidence: null,
    latencyMs: Date.now() - started,
  };
}
