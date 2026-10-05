/**
 * PII Detection, live. The same question asked two ways, in parallel:
 * the LLM writes a sentence and then a JSON object; Jev answers three `noul`
 * questions and returns a probability for each.
 *
 * Reuses the OpenRouter calls from examples.js rather than duplicating them.
 */
import { askJev, askLlm, parseJsonFrom } from './examples.js';

export const PII_MAX_CHARS = 2000;

const FIELDS = ['has_email', 'has_phone', 'has_credit_card'];

const JEV_QUESTIONS = {
  has_email: { type: 'noul', instructions: 'Does this text contain an email address?' },
  has_phone: { type: 'noul', instructions: 'Does this text contain a phone number?' },
  has_credit_card: { type: 'noul', instructions: 'Does this text contain a credit card number?' },
};

const llmPrompt = (message) =>
  'Figure out if this message contains an email address, a phone number, or a credit card number.\n' +
  'First answer in ONE plain-English sentence. Then, on a new line, give a JSON object with exactly ' +
  'these boolean fields: {"has_email": true/false, "has_phone": true/false, "has_credit_card": true/false}.\n\n' +
  `Message: ${message}`;

/** The prose is whatever comes before the JSON (or before a ``` fence). */
function proseFrom(text) {
  const raw = String(text ?? '');
  const cut = [raw.indexOf('```'), raw.indexOf('{')].filter((i) => i >= 0);
  return (cut.length ? raw.slice(0, Math.min(...cut)) : raw).trim();
}

/**
 * `noul` is a number on /api/v1/systemone (see examples.js). Accept an
 * object with a probability too, in case the shape changes.
 */
function probability(answer) {
  const value = answer?.noul;
  const n =
    typeof value === 'number'
      ? value
      : typeof value?.probability === 'number'
        ? value.probability
        : Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function detectPii(message) {
  const [llm, jev] = await Promise.all([askLlm(llmPrompt(message), 300), askJev(message, JEV_QUESTIONS)]);

  const parsed = parseJsonFrom(llm.text);
  const structured =
    parsed && typeof parsed === 'object'
      ? Object.fromEntries(FIELDS.map((key) => [key, parsed[key]]))
      : null;

  return {
    message,
    llm: {
      text: proseFrom(llm.text) || llm.text.trim(),
      raw: llm.text,
      structured,
      parseFailed: structured === null,
      ms: llm.ms,
      cost: llm.cost,
    },
    jev: {
      answers: Object.fromEntries(FIELDS.map((key) => [key, probability(jev.answers[key])])),
      ms: jev.ms,
      cost: jev.cost,
    },
  };
}
