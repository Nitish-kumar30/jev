import { motion } from 'framer-motion';
import { HUMAN_REVIEW, LABEL_STYLES, LABELS } from '../../data/tickets.js';
import { Counter } from '../../components/ui.jsx';

const BIN_ORDER = [...LABELS, HUMAN_REVIEW];

/** The four category bins plus Jev's fifth "Human review" bin. */
export default function Bins({ results, showHumanBin, onSelect }) {
  const bins = BIN_ORDER.filter((b) => b !== HUMAN_REVIEW || showHumanBin);

  return (
    <div
      className={`grid gap-2 ${showHumanBin ? 'grid-cols-5' : 'grid-cols-4'}`}
      data-testid="bins"
    >
      {bins.map((bin) => {
        const items = results.filter((r) => r.label === bin);
        const style = LABEL_STYLES[bin];
        return (
          <div
            key={bin}
            className="rounded-xl border border-white/10 bg-black/30 p-2"
            style={{ boxShadow: items.length ? `inset 0 -2px 18px -8px ${style.color}` : 'none' }}
          >
            <div className="flex items-baseline justify-between gap-1">
              <span
                className="truncate text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: style.color }}
                title={bin}
              >
                {bin === HUMAN_REVIEW ? 'Human' : bin}
              </span>
              <Counter
                value={items.length}
                className="font-mono text-sm text-slate-100"
                data-testid={`bin-count-${bin}`}
              />
            </div>

            <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto pr-0.5">
              {items.map((r) => {
                const wrong = r.label !== HUMAN_REVIEW && r.label !== r.ticket.label;
                return (
                  <li key={r.ticket.id}>
                    <motion.button
                      type="button"
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => onSelect(r)}
                      title={r.ticket.text}
                      className="w-full rounded-md border px-1.5 py-1 text-left font-mono text-[10px] text-slate-200 transition hover:brightness-150"
                      style={{
                        borderColor: wrong ? 'var(--color-spam)' : `${style.color}55`,
                        background: `${style.color}1a`,
                      }}
                    >
                      #{r.ticket.id}
                      {wrong ? <span className="ml-1 text-[var(--color-spam)]">✕</span> : null}
                    </motion.button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
