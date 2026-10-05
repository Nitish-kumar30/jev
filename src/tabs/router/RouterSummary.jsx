import { motion } from 'framer-motion';
import { formatUsd } from '../../lib/routerEngines.js';

const pct = (v) => `${Math.round(v * 100)}%`;

/** One sentence that tracks the slider, e.g. "At 0.80: 58% saved, 0 underpowered, 5 fallbacks." */
export function summarySentence(score, threshold) {
  return `At ${threshold.toFixed(2)}: ${pct(score.savingsPct)} saved, ${score.underpowered} underpowered, ${
    score.fallbacks
  } fallback${score.fallbacks === 1 ? '' : 's'}.`;
}

/**
 * End-of-run card. The slider re-scores the stored confidences, so moving it
 * shows the trade-off without routing anything again.
 */
export default function RouterSummary({ score, threshold, onThreshold, simulated, live, t }) {
  const speedup = score.routedMs > 0 ? score.baselineMs / score.routedMs : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Router summary"
      className={`rounded-2xl p-5 ${t.card} ${t.light ? '' : 'glow-jev'}`}
    >
      <h3 className={`text-lg font-semibold ${t.text}`}>Run summary</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Tile t={t} label="Routed to fast" value={pct(score.fastShare)} sub={`${score.fastCount} of ${score.done}`} />
        <Tile
          t={t}
          label="Saved vs all powerful"
          value={formatUsd(score.savings)}
          sub={`${pct(score.savingsPct)} of ${formatUsd(score.baselineCost)}`}
        />
        <Tile
          t={t}
          label="Total latency"
          value={`${(score.routedMs / 1000).toFixed(1)}s`}
          sub={`vs ${(score.baselineMs / 1000).toFixed(1)}s all powerful${speedup ? ` · ${speedup.toFixed(1)}× faster` : ''}`}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Flag
          t={t}
          color="var(--color-underpowered)"
          icon="▼"
          label="Underpowered"
          value={score.underpowered}
          sub="hard request sent to the fast model — the quality risk"
        />
        <Flag
          t={t}
          color="var(--color-overspent)"
          icon="▲"
          label="Overspent"
          value={score.overspent}
          sub="easy request Jev confidently sent to powerful"
        />
        <Flag
          t={t}
          color={t.tier.powerful}
          icon="↺"
          label="Fallbacks"
          value={score.fallbacks}
          sub="Jev was unsure, so it spent on purpose"
        />
      </div>

      <div className={`mt-5 rounded-xl p-4 ${t.inset}`}>
        <label htmlFor="router-threshold-summary" className={`text-sm font-semibold ${t.text}`}>
          Fallback threshold: <span className="font-mono tabular-nums">{threshold.toFixed(2)}</span>
        </label>
        <p className={`mt-0.5 text-xs ${t.muted}`}>
          Re-scores this run from the stored confidences — nothing is routed again. Higher means
          fewer underpowered requests, but less saved.
        </p>
        <input
          id="router-threshold-summary"
          type="range"
          min="0.5"
          max="0.95"
          step="0.05"
          value={threshold}
          onChange={(e) => onThreshold(Number(e.target.value))}
          className={`mt-3 w-full ${t.light ? 'accent-[#00897B]' : 'accent-[var(--color-jev)]'}`}
        />
        <p className={`mt-3 font-mono text-sm tabular-nums ${t.text}`} aria-live="polite">
          {summarySentence(score, threshold)}
        </p>
      </div>

      {live && score.realCost != null ? (
        <p className={`mt-4 text-sm ${t.body}`}>
          Real cost reported by OpenRouter:{' '}
          <span className={`font-mono font-semibold tabular-nums ${t.text}`}>{formatUsd(score.realCost)}</span>
          {score.anyMeasured ? ' (Jev routing plus the model answers).' : ' (Jev routing only — model answers were not requested).'}
        </p>
      ) : null}

      <p className={`mt-3 text-[11px] leading-relaxed ${t.faint}`}>
        Prices are illustrative list prices from src/lib/constants.js.
        {simulated ? ' Demo-mode routing errors and latencies are simulated.' : ''}
        {live ? ' The all-powerful baseline is estimated from token counts unless the powerful model actually answered.' : ''}
      </p>
    </motion.section>
  );
}

function Tile({ t, label, value, sub }) {
  return (
    <div className={`rounded-xl p-3 ${t.inset}`}>
      <div className={t.label}>{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${t.text}`}>{value}</div>
      <div className={`mt-0.5 text-[11px] ${t.muted}`}>{sub}</div>
    </div>
  );
}

function Flag({ t, color, icon, label, value, sub }) {
  return (
    <div className={`rounded-xl p-3 ${t.inset}`} style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
      <div className="flex items-center gap-1.5">
        <span aria-hidden="true" style={{ color }}>
          {icon}
        </span>
        <span className={`text-xs font-semibold ${t.text}`}>{label}</span>
      </div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums" style={{ color: value > 0 ? color : undefined }}>
        <span className={value > 0 ? '' : t.text}>{value}</span>
      </div>
      <div className={`mt-0.5 text-[11px] leading-snug ${t.muted}`}>{sub}</div>
    </div>
  );
}
