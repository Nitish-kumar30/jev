import {
  ROUTER_ERROR_RATE,
  ROUTER_JEV,
  ROUTER_LATENCY_MS,
  ROUTER_PRICES,
} from './constants.js';
import { makeRng, randBetween } from './random.js';
import { answerWithModel, routeWithJev } from './api.js';

/**
 * Model Router engines. Like engines.js, a demo engine and a live engine sit
 * behind one interface:
 *
 *   route(request) -> Promise<{
 *     jevChoice,        // what Jev picked, before the fallback rule
 *     choice,           // the model actually used: 'fast' | 'powerful'
 *     confidence,       // Jev's confidence in jevChoice, 0..1
 *     fellBack,         // true when low confidence moved a 'fast' pick to 'powerful'
 *     routeLatencyMs, routeCost,     // the Jev routing decision
 *     modelLatencyMs, modelCost,     // the chosen model
 *     baselineCost, baselineLatencyMs, // the same request on the powerful model
 *     estimates: { cost: {fast, powerful}, latency: {fast, powerful} },
 *     measured: { fast, powerful }, // which tier's cost/latency is real, not estimated
 *     answer?,          // the model's reply, Live mode with answers on
 *     simulated,
 *   }>
 *
 * `estimates` is what lets the summary re-score a finished run at another
 * threshold without calling anything again: see scoreRun().
 */

const TIERS = ['fast', 'powerful'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Dollars for one request on one tier, from tokens and list prices. */
export function priceRequest(tokens, tier) {
  const price = ROUTER_PRICES[tier];
  return (tokens.in / 1e6) * price.in + (tokens.out / 1e6) * price.out;
}

/** "$0.0004", not "$0.00": always keeps two significant digits. */
export function formatUsd(value) {
  if (value == null || Number.isNaN(value)) return '—';
  if (value === 0) return '$0';
  const abs = Math.abs(value);
  if (abs >= 1) return `$${value.toFixed(2)}`;
  const decimals = Math.min(8, Math.max(2, 1 - Math.floor(Math.log10(abs))));
  // Drop trailing zeros past the cents: $0.0004 rather than $0.00040.
  const [whole, frac] = value.toFixed(decimals).split('.');
  return `$${whole}.${frac.replace(/0+$/, '').padEnd(2, '0')}`;
}

/** The fallback rule: when Jev is unsure, spend. */
export function resolveRoute(jevChoice, confidence, threshold) {
  const unsure = (confidence ?? 0) < threshold;
  return {
    choice: unsure ? 'powerful' : jevChoice,
    // Only a real fallback when it changed the pick. Low confidence on a
    // 'powerful' pick routes to powerful anyway.
    fellBack: unsure && jevChoice === 'fast',
  };
}

function finish({ request, jevChoice, confidence, threshold, routeLatencyMs, routeCost, estimates, measured, answer, simulated }) {
  const { choice, fellBack } = resolveRoute(jevChoice, confidence, threshold);
  return {
    jevChoice,
    choice,
    confidence,
    fellBack,
    routeLatencyMs,
    routeCost,
    modelLatencyMs: estimates.latency[choice],
    modelCost: estimates.cost[choice],
    baselineCost: estimates.cost.powerful,
    baselineLatencyMs: estimates.latency.powerful,
    estimates,
    measured,
    answer,
    simulated,
    request,
  };
}

function simulatedLatencies(rng) {
  return Object.fromEntries(
    TIERS.map((t) => [t, randBetween(rng, ROUTER_LATENCY_MS[t].min, ROUTER_LATENCY_MS[t].max)])
  );
}

const tokenCosts = (tokens) => Object.fromEntries(TIERS.map((t) => [t, priceRequest(tokens, t)]));
const other = (tier) => (tier === 'fast' ? 'powerful' : 'fast');

/**
 * Demo: confident on clear requests (0.85–0.99) and unsure on borderline ones
 * (0.45–0.8). Clear requests are misrouted at ROUTER_ERROR_RATE, with the same
 * high confidence — those become the Underpowered and Overspent counts.
 */
export function createDemoRouterEngine({ seed, speed = () => 1, threshold = () => 0.7 } = {}) {
  const rng = makeRng(seed ?? Math.floor(Math.random() * 1e9));
  return {
    simulated: true,
    async route(request) {
      const routeLatencyMs = randBetween(rng, ROUTER_JEV.latencyMs.min, ROUTER_JEV.latencyMs.max);

      let jevChoice;
      let confidence;
      if (request.borderline) {
        confidence = randBetween(rng, 0.45, 0.8);
        jevChoice = rng() < 0.6 ? request.tier : other(request.tier);
      } else {
        confidence = randBetween(rng, 0.85, 0.99);
        jevChoice = rng() < ROUTER_ERROR_RATE ? other(request.tier) : request.tier;
      }

      const estimates = { cost: tokenCosts(request.tokens), latency: simulatedLatencies(rng) };
      const result = finish({
        request,
        jevChoice,
        confidence,
        threshold: threshold(),
        routeLatencyMs,
        routeCost: ROUTER_JEV.costPerDecision,
        estimates,
        measured: { fast: false, powerful: false },
        simulated: true,
      });
      await sleep((routeLatencyMs + result.modelLatencyMs) / speed());
      return result;
    },
  };
}

/**
 * Live: Jev's routing call is real. With `answer()` on, the chosen model is
 * really called and its cost, latency and token counts replace the estimates
 * for that tier; the other tier is priced from the same real token counts.
 * With it off, model cost comes from the dataset tokens and latency is simulated.
 */
export function createLiveRouterEngine({ seed, speed = () => 1, threshold = () => 0.7, answer = () => false } = {}) {
  const rng = makeRng(seed ?? Math.floor(Math.random() * 1e9));
  return {
    simulated: false,
    async route(request) {
      const routed = await routeWithJev(request.text);
      const jevChoice = routed.choice === 'fast' || routed.choice === 'powerful' ? routed.choice : 'powerful';
      const confidence = typeof routed.confidence === 'number' ? routed.confidence : null;
      const { choice } = resolveRoute(jevChoice, confidence, threshold());

      const estimates = { cost: tokenCosts(request.tokens), latency: simulatedLatencies(rng) };
      const measured = { fast: false, powerful: false };
      let reply;

      if (answer()) {
        const res = await answerWithModel(request.text, choice);
        const tokens = res.tokens && res.tokens.in != null ? res.tokens : request.tokens;
        estimates.cost = tokenCosts(tokens);
        if (typeof res.cost === 'number') estimates.cost[choice] = res.cost;
        estimates.latency[choice] = res.ms;
        measured[choice] = true;
        reply = res.text;
      } else {
        await sleep(estimates.latency[choice] / speed());
      }

      return finish({
        request,
        jevChoice,
        confidence,
        threshold: threshold(),
        routeLatencyMs: routed.latencyMs ?? 0,
        routeCost: typeof routed.cost === 'number' ? routed.cost : ROUTER_JEV.costPerDecision,
        estimates,
        measured,
        answer: reply,
        simulated: false,
      });
    },
  };
}

export function createRouterEngine({ live, ...opts }) {
  return live ? createLiveRouterEngine(opts) : createDemoRouterEngine(opts);
}

/**
 * Re-scores stored results at any threshold. Pure: the slider calls this and
 * nothing is re-run. Everything on screen (lanes, totals, chart, summary)
 * comes from here, so it all stays consistent.
 */
export function scoreRun(results, threshold) {
  let routed = 0;
  let baseline = 0;
  let routedMs = 0;
  let baselineMs = 0;
  let fast = 0;
  let underpowered = 0;
  let overspent = 0;
  let fallbacks = 0;
  let realCost = 0;
  let realCostKnown = false;
  const cumulative = [];

  const rows = results.map((r) => {
    const { choice, fellBack } = resolveRoute(r.jevChoice, r.confidence, threshold);
    const modelCost = r.estimates.cost[choice];
    const modelMs = r.estimates.latency[choice];
    const cost = r.routeCost + modelCost;
    const isUnder = r.request.tier === 'powerful' && choice === 'fast';
    const isOver = r.request.tier === 'fast' && choice === 'powerful' && !fellBack;

    routed += cost;
    baseline += r.baselineCost;
    routedMs += r.routeLatencyMs + modelMs;
    baselineMs += r.baselineLatencyMs;
    if (choice === 'fast') fast += 1;
    if (isUnder) underpowered += 1;
    if (isOver) overspent += 1;
    if (fellBack) fallbacks += 1;
    if (!r.simulated) {
      realCostKnown = true;
      realCost += r.routeCost + (r.measured?.[choice] ? modelCost : 0);
    }
    cumulative.push({ routed, baseline });

    return { ...r, choice, fellBack, modelCost, modelLatencyMs: modelMs, cost, underpowered: isUnder, overspent: isOver };
  });

  const savings = baseline - routed;
  return {
    rows,
    done: results.length,
    routedCost: routed,
    baselineCost: baseline,
    savings,
    savingsPct: baseline > 0 ? savings / baseline : 0,
    routedMs,
    baselineMs,
    fastCount: fast,
    fastShare: results.length ? fast / results.length : 0,
    underpowered,
    overspent,
    fallbacks,
    cumulative,
    realCost: realCostKnown ? realCost : null,
    anyMeasured: results.some((r) => r.measured?.fast || r.measured?.powerful),
  };
}
