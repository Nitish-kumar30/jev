import { CONFIDENCE_THRESHOLD, COST_PER_MESSAGE, ERROR_RATE, LATENCY_MS } from './constants.js';
import { HUMAN_REVIEW, LABELS } from '../data/tickets.js';
import { makeRng, pick, randBetween } from './random.js';
import { classifyWithJev, classifyWithLlm } from './api.js';

/**
 * Both engines expose the same shape:
 *
 *   classify(ticket) -> Promise<{
 *     label,            // predicted label, or 'Human review' for a Jev abstention
 *     confidence,       // 0..1 for Jev, null for the LLM (it does not report one)
 *     flagged,          // true when Jev handed the message to a human
 *     latencyMs,        // measured wall-clock time for this message
 *     cost,             // dollars for this message
 *     simulated,        // true in demo mode
 *   }>
 *
 * The race component does not care which implementation it is driving.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wrongLabel = (rng, correct) => pick(rng, LABELS.filter((l) => l !== correct));

/**
 * Confidence bands. Clear-cut messages land high; genuinely ambiguous ones
 * ("charged twice and the app crashed") land near or under the threshold,
 * which is exactly when Jev should stop and ask.
 */
function simulateConfidence(rng, ticket) {
  if (ticket.ambiguous) return randBetween(rng, 0.42, 0.78);
  if (ticket.tricky) return randBetween(rng, 0.63, 0.92);
  return randBetween(rng, 0.84, 0.995);
}

/** Demo-mode Jev: fast, typed, and willing to say "not sure". */
export function createDemoJevEngine({ seed, speed = () => 1 } = {}) {
  const rng = makeRng(seed ?? Math.floor(Math.random() * 1e9));
  return {
    id: 'jev',
    simulated: true,
    async classify(ticket) {
      const latencyMs = randBetween(rng, LATENCY_MS.jev.min, LATENCY_MS.jev.max);
      await sleep(latencyMs / speed());

      const confidence = simulateConfidence(rng, ticket);
      if (confidence < CONFIDENCE_THRESHOLD) {
        return {
          label: HUMAN_REVIEW,
          confidence,
          flagged: true,
          latencyMs,
          cost: COST_PER_MESSAGE.jev,
          simulated: true,
        };
      }
      const wrong = rng() < ERROR_RATE.jev;
      return {
        label: wrong ? wrongLabel(rng, ticket.label) : ticket.label,
        confidence,
        flagged: false,
        latencyMs,
        cost: COST_PER_MESSAGE.jev,
        simulated: true,
      };
    },
  };
}

/** Demo-mode chatbot: slower, pricier, and always sounds certain. */
export function createDemoLlmEngine({ seed, speed = () => 1 } = {}) {
  const rng = makeRng((seed ?? Math.floor(Math.random() * 1e9)) + 7919);
  return {
    id: 'llm',
    simulated: true,
    async classify(ticket) {
      const latencyMs = randBetween(rng, LATENCY_MS.llm.min, LATENCY_MS.llm.max);
      await sleep(latencyMs / speed());

      const wrong = rng() < ERROR_RATE.llm;
      return {
        label: wrong ? wrongLabel(rng, ticket.label) : ticket.label,
        confidence: null, // the chatbot returns prose, not a calibrated number
        flagged: false,
        latencyMs,
        cost: COST_PER_MESSAGE.llm,
        simulated: true,
      };
    },
  };
}

/** Live mode: the backend talks to the real APIs; we only time the round trip. */
function createLiveEngine(id, call) {
  return {
    id,
    simulated: false,
    async classify(ticket) {
      const started = performance.now();
      const res = await call(ticket.text);
      const latencyMs = res.latencyMs ?? performance.now() - started;
      const confidence = typeof res.confidence === 'number' ? res.confidence : null;
      const flagged = id === 'jev' && confidence !== null && confidence < CONFIDENCE_THRESHOLD;
      return {
        label: flagged ? HUMAN_REVIEW : res.label,
        confidence,
        flagged,
        latencyMs,
        cost: typeof res.cost === 'number' ? res.cost : COST_PER_MESSAGE[id],
        simulated: false,
      };
    },
  };
}

export const createLiveJevEngine = () => createLiveEngine('jev', classifyWithJev);
export const createLiveLlmEngine = () => createLiveEngine('llm', classifyWithLlm);

export function createEngines({ live, seed, speed }) {
  if (live) {
    return { jev: createLiveJevEngine(), llm: createLiveLlmEngine() };
  }
  return {
    jev: createDemoJevEngine({ seed, speed }),
    llm: createDemoLlmEngine({ seed, speed }),
  };
}
