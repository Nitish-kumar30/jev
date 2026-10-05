import ProbabilityBar from './ProbabilityBar.jsx';
import { PII_FIELDS } from '../../data/piiMessages.js';

/**
 * Jev's answer: one row per question, a large probability on the right and a
 * full-width bar below. `fill` (0..1) is shared, so the bars fill together.
 */
export default function JevResult({ answers, fill, light, threshold = null, compact = false }) {
  return (
    <div className="flex flex-col gap-4">
      {PII_FIELDS.map(({ key }) => {
        const value = typeof answers?.[key] === 'number' ? answers[key] : null;
        const shown = value === null ? null : value * fill;
        const flagged = threshold !== null && value !== null && value >= threshold;
        return (
          <div key={key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={`font-mono text-xs ${light ? 'text-[#243044]' : 'text-slate-300'}`}>
                {key}
                {threshold !== null ? (
                  <span
                    className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      flagged
                        ? light
                          ? 'bg-[var(--color-pii-jev)] text-[var(--color-pii-jev-ink)]'
                          : 'bg-[var(--color-pii-jev)]/20 text-[var(--color-pii-jev)]'
                        : light
                          ? 'text-[#5C6778]'
                          : 'text-slate-500'
                    }`}
                  >
                    {flagged ? 'PII' : 'clear'}
                  </span>
                ) : null}
              </span>
              <span
                className={`font-mono font-semibold tabular-nums ${compact ? 'text-xl' : 'text-3xl'} ${
                  light ? 'text-[var(--color-pii-jev-ink)]' : 'text-[var(--color-pii-jev)]'
                }`}
              >
                {shown === null ? 'n/a' : shown.toFixed(2)}
              </span>
            </div>
            <div className="mt-1.5">
              <ProbabilityBar value={value ?? 0} fill={fill} threshold={threshold} light={light} flagged={flagged} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
