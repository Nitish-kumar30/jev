/**
 * Seconds with one decimal, or two when the final value is under 0.1s (a fast
 * live call). Precision follows `finalMs`, so a counting timer never changes width.
 */
export function formatSeconds(ms, finalMs = ms) {
  const s = Math.max(0, ms) / 1000;
  return `${finalMs > 0 && finalMs < 95 ? s.toFixed(2) : s.toFixed(1)}s`;
}

export function formatCost(cost) {
  if (cost == null) return '—';
  return cost < 0.01 ? `$${cost.toFixed(6)}` : `$${cost.toFixed(4)}`;
}
