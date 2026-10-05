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

/* ---------------------------------------------------------------------------
 * Model Router tab
 * ------------------------------------------------------------------------- */

/** Illustrative list prices, USD per 1M tokens. Edit freely. */
export const ROUTER_PRICES = {
  fast: { in: 0.15, out: 0.6 },
  powerful: { in: 3, out: 15 },
};

/** Simulated model latency per request, in milliseconds (inclusive range). */
export const ROUTER_LATENCY_MS = {
  fast: { min: 400, max: 900 },
  powerful: { min: 2000, max: 6000 },
};

/** What one Jev routing decision costs and how long it takes. */
export const ROUTER_JEV = { costPerDecision: 0.00001, latencyMs: { min: 8, max: 40 } };

/** Demo only: share of clear (non-borderline) requests Jev routes wrongly. */
export const ROUTER_ERROR_RATE = 0.05;

/** Below this confidence the router sends the request to the powerful model. */
export const ROUTER_FALLBACK_THRESHOLD = 0.7;

/** Display names for the two lanes in Demo mode. Live mode shows the server's. */
export const ROUTER_MODELS = { fast: 'openai/gpt-4o-mini', powerful: 'openai/gpt-4o' };
