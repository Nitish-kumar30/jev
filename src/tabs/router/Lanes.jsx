import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Counter } from '../../components/ui.jsx';
import { formatUsd } from '../../lib/routerEngines.js';
import { usePrefersReducedMotion } from '../../lib/useReducedMotion.js';
import { TIER_LABEL } from './theme.js';

/**
 * Two lanes. Each routed request flies into the lane for the model it used.
 * Cards use layout animation, so moving the threshold slides them between
 * lanes instead of re-rendering them in place.
 */
export default function Lanes({ rows, models, onSelect, t }) {
  return (
    <section aria-label="Model lanes" className="grid min-h-0 gap-3 sm:grid-cols-2">
      <LayoutGroup id="router-lanes">
        {['fast', 'powerful'].map((tier) => (
          <Lane
            key={tier}
            tier={tier}
            model={models[tier]}
            rows={rows.filter((r) => r.choice === tier)}
            onSelect={onSelect}
            t={t}
          />
        ))}
      </LayoutGroup>
    </section>
  );
}

function Lane({ tier, model, rows, onSelect, t }) {
  const reduced = usePrefersReducedMotion();
  const color = t.tier[tier];
  const spend = rows.reduce((sum, r) => sum + r.modelCost, 0);

  return (
    <div
      className={`flex min-h-[14rem] flex-col rounded-2xl p-4 ${t.card}`}
      style={{ boxShadow: t.light ? `inset 0 3px 0 ${color}` : `inset 0 3px 0 ${color}, 0 0 30px -18px ${color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold" style={{ color }}>
            {TIER_LABEL[tier]}
          </h3>
          <p className={`truncate font-mono text-[11px] ${t.muted}`} title={model}>
            {model}
          </p>
        </div>
        <div className="text-right">
          <Counter value={rows.length} className={`font-mono text-2xl font-semibold tabular-nums ${t.text}`} />
          <div className={`font-mono text-[11px] tabular-nums ${t.muted}`}>
            <Counter value={spend} format={formatUsd} /> spent
          </div>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap content-start gap-1.5">
        <AnimatePresence initial={false}>
          {rows.map((r) => {
            const flag = r.underpowered ? 'var(--color-underpowered)' : r.overspent ? 'var(--color-overspent)' : null;
            return (
              <motion.li
                key={r.request.id}
                layout={!reduced}
                layoutId={reduced ? undefined : `route-${r.request.id}`}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -28, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 30 }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(r)}
                  title={r.request.text}
                  aria-label={`Request ${r.request.id}: ${r.request.text}. Routed to ${r.choice}${
                    r.fellBack ? ' by fallback' : ''
                  }${r.underpowered ? ', underpowered' : r.overspent ? ', overspent' : ''}. Open details.`}
                  className={`rounded-md border px-2 py-1 font-mono text-[11px] tabular-nums transition hover:brightness-125 ${
                    r.fellBack ? 'border-dashed' : ''
                  } ${t.text}`}
                  style={{
                    borderColor: flag ?? `color-mix(in srgb, ${color} 55%, transparent)`,
                    borderWidth: flag ? 2 : 1,
                    background: `color-mix(in srgb, ${color} ${t.light ? 10 : 14}%, transparent)`,
                  }}
                >
                  #{r.request.id}
                  {r.underpowered ? <span className="ml-1 text-[var(--color-underpowered)]">▼</span> : null}
                  {r.overspent ? <span className="ml-1 text-[var(--color-overspent)]">▲</span> : null}
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
