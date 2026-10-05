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

/** The two models behind the Model Router tab. Any OpenRouter chat model ids. */
export const routerModels = () => ({
  fast: process.env.ROUTER_FAST_MODEL || 'openai/gpt-4o-mini',
  powerful: process.env.ROUTER_POWERFUL_MODEL || 'openai/gpt-4o',
});

/** Caps each routed answer so "Answer each request" cannot run up a large bill. */
const ANSWER_MAX_TOKENS = 600;

/**
 * Answer one routed request on the fast or powerful model, with usage so the
 * tab can show the real cost and price the baseline from real token counts.
 *
 * @returns {Promise<{text: string, ms: number, cost: number|null, tokens: {in: number|null, out: number|null}, model: string}>}
 */
export async function llmAnswer(request, tier) {
  const model = routerModels()[tier];
  const started = Date.now();

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${llmKey()}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: ANSWER_MAX_TOKENS,
      usage: { include: true },
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant at a SaaS company. Answer the request directly and concisely. If it refers to text, logs or code that were not provided, say what you would need and outline your approach.',
        },
        { role: 'user', content: request },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LLM API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const usage = data.usage ?? {};
  return {
    text: readText(data.choices?.[0]?.message?.content),
    ms: Date.now() - started,
    cost: typeof usage.cost === 'number' ? usage.cost : null,
    tokens: {
      in: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : null,
      out: typeof usage.completion_tokens === 'number' ? usage.completion_tokens : null,
    },
    model,
  };
}
