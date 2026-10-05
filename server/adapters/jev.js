/**
 * Jev via OpenRouter's Decisions API.
 *
 * This is not a chat model. Requests go to /api/alpha/decisions and come back
 * as a typed choice plus a confidence value. They are never sent to
 * /api/v1/chat/completions.
 *
 * The key stays in server/.env and never reaches the browser.
 */

const DECISIONS_URL = 'https://openrouter.ai/api/alpha/decisions';

const LABELS = ['Billing', 'Technical', 'Refund', 'Spam'];
const GATE_DECISIONS = ['allow', 'ask', 'block'];

const jevKey = () => process.env.OPENROUTER_API_KEY || process.env.JEV_API_KEY;
const jevModel = () => process.env.JEV_MODEL || 'typesafe/jev-1.13';

export const hasJevKey = () => Boolean(jevKey());

async function decide(state, questions) {
  const started = Date.now();
  const res = await fetch(DECISIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jevKey()}`,
    },
    body: JSON.stringify({
      model: jevModel(),
      state,
      questions,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Jev API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  return { data, latencyMs: Date.now() - started };
}

function readChoice(data, name, allowed) {
  const answer = data?.answers?.[name];
  const choice = answer?.choice;
  if (!allowed.includes(choice)) {
    throw new Error(`Jev returned an unexpected ${name} choice: ${choice ?? 'none'}`);
  }
  const confidence = typeof answer.confidence === 'number' ? answer.confidence : null;
  return { choice, confidence, cost: data?.usage?.cost };
}

/**
 * Classify one support message into Billing | Technical | Refund | Spam.
 *
 * @returns {Promise<{label: string, confidence: number, latencyMs: number, cost?: number}>}
 */
export async function jevClassify(message) {
  const { data, latencyMs } = await decide(
    { message },
    {
      category: {
        type: 'choice',
        instructions: 'Which queue should handle this customer message?',
        criteria: {
          Billing: 'Invoices, charges, plans, payment methods, or pricing questions',
          Technical: 'Bugs, crashes, login failures, or something in the product not working',
          Refund: 'The customer wants money returned, a charge reversed, or a cancellation refunded',
          Spam: 'Unsolicited promotion, a scam, or a message that is not a real support request',
        },
      },
    }
  );

  const { choice, confidence, cost } = readChoice(data, 'category', LABELS);
  return { label: choice, confidence, latencyMs, cost };
}

/**
 * Judge whether an agent may perform an action.
 *
 * `fetchedContent` is only included when the caller opts in. Sending content
 * the agent fetched lets that content influence the gate — the risk the
 * second tab demonstrates.
 *
 * Jev does not write an explanation. `reason` is a one-line restatement of
 * the typed verdict so the UI still has a sentence to show.
 *
 * @returns {Promise<{decision: 'allow'|'ask'|'block', confidence: number, reason: string, influenced: boolean}>}
 */
export async function jevGate(action, fetchedContent) {
  const state = fetchedContent ? { action, fetchedContent } : { action };
  const { data, latencyMs } = await decide(state, {
    verdict: {
      type: 'choice',
      instructions:
        'May the agent perform this action? Choose ask when the action is consequential but not clearly forbidden, or when the request is ambiguous.',
      criteria: {
        allow: 'Safe, reversible, and clearly within what was asked',
        ask: 'Consequential or ambiguous — a person should confirm before it runs',
        block: 'Harmful, irreversible, or clearly outside what was asked',
      },
    },
  });

  const { choice, confidence } = readChoice(data, 'verdict', GATE_DECISIONS);
  const influenced = Boolean(fetchedContent) && choice === 'allow';
  return {
    decision: choice,
    confidence,
    reason: `Jev chose ${choice}.`,
    influenced,
    latencyMs,
  };
}

const ROUTER_TIERS = ['fast', 'powerful'];

/**
 * Model routing, after LangChain's "Building a harness with Jev": one choice
 * question before a request reaches an LLM — the cheap fast model, or the
 * expensive capable one. The fallback rule (low confidence → powerful) is
 * applied by the caller, so the threshold can change without a new call.
 *
 * @returns {Promise<{choice: 'fast'|'powerful', confidence: number|null, latencyMs: number, cost?: number}>}
 */
export async function jevRoute(request) {
  const { data, latencyMs } = await decide(
    { request },
    {
      model: {
        type: 'choice',
        instructions: 'Choose the least costly model that can complete the task.',
        criteria: {
          fast: 'Direct lookups, extraction, short rewrites, translations and small localized changes',
          powerful:
            'Design, architecture, multi-step reasoning, root-cause analysis, and high-stakes or ambiguous judgement',
        },
      },
    }
  );

  const { choice, confidence, cost } = readChoice(data, 'model', ROUTER_TIERS);
  return { choice, confidence, latencyMs, cost };
}
