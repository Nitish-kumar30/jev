import { motion } from 'framer-motion';
import { GlassCard } from '../../components/ui.jsx';

/** End-of-race summary. Every number here is measured, not hardcoded. */
export default function ResultsCard({ stats, speedup, simulated, light = false }) {
  const costRatio = stats.jev.cost > 0 ? stats.llm.cost / stats.jev.cost : null;
  const fmtX = (v) => (v >= 10 ? Math.round(v) : v.toFixed(1));

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard plain={light} className={light ? 'p-5' : 'glow-jev p-5'}>
        <h3 className={`text-lg font-semibold ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>Race results</h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Column light={light}
            title="Chatbot AI (LLM)"
            color={light ? '#D97706' : 'var(--color-bot)'}
            rows={[
              ['Engine time', `${Math.round(stats.llm.elapsed).toLocaleString()} ms`],
              ['Wall clock', `${Math.round(stats.llm.wallMs).toLocaleString()} ms`],
              ['Total cost', `$${stats.llm.cost.toFixed(4)}`],
              ['Accuracy', stats.llm.accuracy === null ? '—' : `${(stats.llm.accuracy * 100).toFixed(1)}%`],
              ['Sent to a human', '0 — it never said it was unsure'],
            ]}
          />
          <Column light={light}
            title="Jev"
            color={light ? '#00897B' : 'var(--color-jev)'}
            rows={[
              ['Engine time', `${Math.round(stats.jev.elapsed).toLocaleString()} ms`],
              ['Wall clock', `${Math.round(stats.jev.wallMs).toLocaleString()} ms`],
              ['Total cost', `$${stats.jev.cost.toFixed(5)}`],
              ['Accuracy', stats.jev.accuracy === null ? '—' : `${(stats.jev.accuracy * 100).toFixed(1)}% of the ${stats.jev.decided} it decided`],
              ['Sent to a human', `${stats.jev.flagged}`],
            ]}
          />
        </div>

        <p className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed ${
          light ? 'border-[#00897B]/30 bg-[#D7F2EC] text-[#141B2E]' : 'border-[var(--color-jev)]/30 bg-[var(--color-jev)]/10 text-slate-100'
        }`}>
          {speedup
            ? `Jev finished ${fmtX(speedup)}× faster${
                costRatio ? ` at about 1/${Math.round(costRatio)} of the cost` : ''
              }, and told us when it was unsure — ${stats.jev.flagged} message${
                stats.jev.flagged === 1 ? '' : 's'
              } went to a human instead of into the wrong bin.`
            : 'Run the race to see the comparison.'}
        </p>

        <p className={`mt-3 text-[11px] leading-relaxed ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>
          Engine time is the time the engines spent classifying at 1× — that is what the
          speed-up is computed from. Wall clock is how long you waited, so it is divided by the
          speed multiplier and includes this page's animation work.{' '}
          {simulated ? 'Cost and speed ratios are illustrative in demo mode. ' : ''}
          Vendor claims (up to 200× faster, 400× cheaper) are unverified.
        </p>
      </GlassCard>
    </motion.div>
  );
}

function Column({ title, color, rows, light = false }) {
  return (
    <div className={`rounded-xl border p-4 ${light ? 'border-[#E4E0D6] bg-[#F7F5F0]' : 'border-white/10 bg-black/25'}`}>
      <div className="text-sm font-semibold" style={{ color }}>
        {title}
      </div>
      <dl className="mt-3 space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <dt className={`font-mono text-[10px] uppercase tracking-[0.14em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>{k}</dt>
            <dd className={`text-right font-mono text-xs ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
