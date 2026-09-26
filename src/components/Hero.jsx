import { motion } from 'framer-motion';
import { GlassCard, Pill } from './ui';

const COMPARISON = [
  {
    label: 'Output',
    bot: 'Sentences. Free-form text a person reads.',
    jev: 'A typed decision: a label, a score, or yes/no — plus a probability.',
  },
  {
    label: 'Speed',
    bot: 'Roughly a second per message.',
    jev: 'Milliseconds per message. Vendor claims up to 200× faster.',
  },
  {
    label: 'Cost',
    bot: 'Cents add up fast at volume.',
    jev: 'Fractions of a cent. Vendor claims up to 400× cheaper.',
  },
  {
    label: 'Best for',
    bot: 'Writing, explaining, chatting, summarising.',
    jev: 'Sorting, scoring, routing, and gating what software does next.',
  },
];

export default function Hero({ light = false }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pt-10 sm:pt-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <Pill
          className={
            light
              ? 'border-[#E4E0D6] bg-[#FDFCFA] text-[#243044]'
              : ''
          }
        >
          System One decision model · TypeSafe AI
        </Pill>
        <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          <span className={light ? 'text-[#D97706]' : 'text-glow-bot text-[var(--color-bot)]'}>
            Chatbots write.
          </span>{' '}
          <span className={light ? 'text-[#00897B]' : 'text-glow-jev text-[var(--color-jev)]'}>
            Jev decides.
          </span>
        </h1>
        <p
          className={`mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed sm:text-lg ${
            light ? 'text-[#243044]' : 'text-slate-300'
          }`}
        >
          A chatbot produces sentences for a human to read. Jev returns a decision your
          software can act on — a choice, a score, a yes or no, with a confidence value
          attached. Below you can watch both do the same job, side by side.
        </p>
      </motion.div>

      {light ? (
        <div className="mt-10 overflow-hidden rounded-xl border border-[#E4E0D6] bg-[#FDFCFA]">
          <div className="grid grid-cols-[minmax(4.5rem,0.6fr)_1fr_1fr] gap-px bg-[#E4E0D6] text-sm">
            <div className="bg-[#FDFCFA] px-4 py-3" />
            <div className="bg-[#FDFCFA] px-4 py-3 font-semibold text-[#D97706]">Chatbot AI (LLM)</div>
            <div className="bg-[#FDFCFA] px-4 py-3 font-semibold text-[#00897B]">Jev (decision model)</div>
            {COMPARISON.map((row) => (
              <Row key={row.label} light {...row} />
            ))}
          </div>
        </div>
      ) : (
        <GlassCard className="mt-10 overflow-hidden">
          <div className="grid grid-cols-[minmax(4.5rem,0.6fr)_1fr_1fr] gap-px bg-white/8 text-sm">
            <div className="bg-[var(--color-abyss)] px-4 py-3" />
            <div className="bg-[var(--color-abyss)] px-4 py-3 font-semibold text-[var(--color-bot)]">
              Chatbot AI (LLM)
            </div>
            <div className="bg-[var(--color-abyss)] px-4 py-3 font-semibold text-[var(--color-jev)]">
              Jev (decision model)
            </div>
            {COMPARISON.map((row) => (
              <Row key={row.label} {...row} />
            ))}
          </div>
        </GlassCard>
      )}
      <p className={`mt-3 text-center text-[11px] ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>
        Speed and cost figures are vendor-reported by TypeSafe AI and unverified here.
        Everything on this page runs on simulated numbers unless Live mode is on.
      </p>
    </section>
  );
}

function Row({ label, bot, jev, light = false }) {
  if (light) {
    return (
      <>
        <div className="bg-[#FDFCFA] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#3E4A5C]">
          {label}
        </div>
        <div className="bg-[#FDFCFA] px-4 py-3 text-[#243044]">{bot}</div>
        <div className="bg-[#FDFCFA] px-4 py-3 text-[#141B2E]">{jev}</div>
      </>
    );
  }
  return (
    <>
      <div className="bg-[var(--color-hull)]/70 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div className="bg-[var(--color-hull)]/40 px-4 py-3 text-slate-300">{bot}</div>
      <div className="bg-[var(--color-hull)]/40 px-4 py-3 text-slate-200">{jev}</div>
    </>
  );
}
