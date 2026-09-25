import { CONFIDENCE_THRESHOLD } from './constants.js';

/**
 * Demo-mode gate: a small keyword + amount rule engine. It returns the same
 * shape the live Jev gate endpoint is expected to return:
 *
 *   { decision: 'allow' | 'ask' | 'block', confidence: 0..1, reason: string }
 *
 * Confidence is what makes the middle state possible: a decision the model is
 * not sure about becomes "ask a human" rather than a confident guess.
 */

export const DECISIONS = {
  allow: { key: 'allow', label: 'ALLOW', color: 'var(--color-allow)', plain: 'Go ahead' },
  ask: { key: 'ask', label: 'ASK A HUMAN', color: 'var(--color-ask)', plain: 'Check with a person first' },
  block: { key: 'block', label: 'BLOCK', color: 'var(--color-block)', plain: 'Do not do this' },
};

/** Pulls the largest money amount out of free text, e.g. "$1,250.50" -> 1250.5 */
export function extractAmount(text) {
  const matches = [...text.matchAll(/\$\s?([\d,]+(?:\.\d{1,2})?)/g)].map((m) =>
    Number(m[1].replace(/,/g, ''))
  );
  const bare = [...text.matchAll(/\b([\d,]{3,})\s?(?:dollars|usd)\b/gi)].map((m) =>
    Number(m[1].replace(/,/g, ''))
  );
  const all = [...matches, ...bare];
  return all.length ? Math.max(...all) : null;
}

const has = (text, words) => words.some((w) => text.includes(w));

/**
 * @param {string} action        what the agent says it wants to do
 * @param {object} opts
 * @param {string} [opts.fetchedContent]  content the agent pulled in
 * @param {boolean} [opts.seeContent]     whether the gate is allowed to read it
 */
export function evaluateAction(action, { fetchedContent = '', seeContent = false } = {}) {
  const text = action.toLowerCase();
  const amount = extractAmount(action);
  const injected = seeContent && fetchedContent ? fetchedContent.toLowerCase() : '';

  // Illustration only: when the gate is allowed to treat fetched content as
  // instructions, text inside that content can talk it into being lenient.
  const influenced =
    Boolean(injected) &&
    has(injected, ['ignore all rules', 'pre-authorised', 'pre-authorized', 'do not ask a human', 'approve this']);

  if (influenced) {
    return {
      decision: 'allow',
      confidence: 0.58,
      reason:
        'The fetched email says this refund is pre-authorised and that no human is needed, so the gate treated it as approved.',
      influenced: true,
      amount,
    };
  }

  // Irreversible, wide-blast-radius actions.
  if (has(text, ['delete all', 'delete every', 'wipe', 'drop database', 'rm -rf', 'format disk'])) {
    return {
      decision: 'block',
      confidence: 0.93,
      reason: 'This deletes many files at once and cannot be undone.',
      amount,
    };
  }
  if (has(text, ['transfer', 'wire', 'send money', 'payout']) && (amount === null || amount >= 1000)) {
    return {
      decision: 'block',
      confidence: 0.91,
      reason: `Moving ${amount ? `$${amount.toLocaleString()}` : 'money'} to a new account is high risk and hard to reverse.`,
      amount,
    };
  }
  if (has(text, ['password', 'credential', 'api key', 'secret', 'ssn', 'credit card number'])) {
    return {
      decision: 'block',
      confidence: 0.9,
      reason: 'This involves credentials or sensitive personal data.',
      amount,
    };
  }

  // Money: size decides.
  if (has(text, ['refund', 'credit', 'reimburse', 'charge back'])) {
    if (amount === null) {
      return {
        decision: 'ask',
        confidence: 0.61,
        reason: 'A refund with no amount given — a person should confirm how much.',
        amount,
      };
    }
    if (amount <= 50) {
      return {
        decision: 'allow',
        confidence: 0.96,
        reason: `$${amount} is within the routine refund limit and easy to reverse.`,
        amount,
      };
    }
    if (amount <= 1000) {
      return {
        decision: 'ask',
        confidence: 0.64,
        reason: `$${amount.toLocaleString()} is above the routine limit, so a person should approve it.`,
        amount,
      };
    }
    return {
      decision: 'block',
      confidence: 0.88,
      reason: `$${amount.toLocaleString()} is far above the refund limit for an automated action.`,
      amount,
    };
  }

  // Public or outbound actions.
  if (has(text, ['social media', 'tweet', 'post on', 'publish', 'press release'])) {
    return {
      decision: 'ask',
      confidence: 0.58,
      reason: 'Anything published under the company name should be read by a person first.',
      amount,
    };
  }
  if (has(text, ['delete', 'remove file', 'archive file'])) {
    return {
      decision: 'ask',
      confidence: 0.66,
      reason: 'Deleting a single file is reversible only if there is a backup.',
      amount,
    };
  }
  if (has(text, ['email', 'reply', 'message the customer', 'send a note'])) {
    return {
      decision: 'allow',
      confidence: 0.94,
      reason: 'Sending a routine customer email is low risk and easy to correct.',
      amount,
    };
  }
  if (has(text, ['read', 'list', 'search', 'look up', 'fetch', 'summarise', 'summarize'])) {
    return {
      decision: 'allow',
      confidence: 0.95,
      reason: 'This only reads data and changes nothing.',
      amount,
    };
  }

  // Nothing matched: unknown action, low confidence, ask.
  return {
    decision: 'ask',
    confidence: 0.52,
    reason: 'The gate does not recognise this action, so it will not decide alone.',
    amount,
  };
}

/** A decision is only auto-applied when the gate is confident about it. */
export const isConfident = (confidence) => confidence >= CONFIDENCE_THRESHOLD;
