/**
 * Every tunable number for the demo lives here so it is easy to adjust.
 * Costs are per message, in US dollars.
 */

export const COST_PER_MESSAGE = {
  llm: 0.002, // ~$2 per 1,000 classified messages
  jev: 0.00001, // ~$0.01 per 1,000 classified messages
};

/** Simulated per-message latency, in milliseconds (inclusive range). */
export const LATENCY_MS = {
  llm: { min: 900, max: 1800 },
  jev: { min: 8, max: 40 },
};

/** Share of messages each engine gets wrong in the simulation. */
export const ERROR_RATE = {
  llm: 0.08,
  jev: 0.04,
};

/** Below this confidence, Jev refuses to decide and asks for a human. */
export const CONFIDENCE_THRESHOLD = 0.7;

export const SPEED_OPTIONS = [1, 2, 4];
