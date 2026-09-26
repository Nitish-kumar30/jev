import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Bins from './Bins.jsx';
import { GlassCard, Counter, SimulatedBadge, Stat } from '../../components/ui.jsx';
import { TICKETS, LABEL_STYLES } from '../../data/tickets.js';
import { usePrefersReducedMotion } from '../../lib/useReducedMotion.js';

const money = (v) => `$${v.toFixed(5)}`;
const ms = (v) => `${Math.round(v).toLocaleString()} ms`;

/** One side of the race: queue on top, flying card in the middle, bins below. */
export default function RacePanel({ side, state, stats, simulated, speed, onSelect, light = false }) {
  const isJev = side === 'jev';
  const accent = light ? (isJev ? '#00897B' : '#D97706') : isJev ? 'var(--color-jev)' : 'var(--color-bot)';
  const reduced = usePrefersReducedMotion();
  const [flying, setFlying] = useState(null);

  // Briefly show the most recent decision as a card flying into its bin.
  const latest = state.results[state.results.length - 1];
  useEffect(() => {
    if (!latest) {
      setFlying(null);
      return undefined;
    }
    setFlying(latest);
    const t = setTimeout(() => setFlying(null), Math.max(220, 700 / speed));
    return () => clearTimeout(t);
  }, [latest, speed]);

  const queued = TICKETS.slice(state.results.length, state.results.length + 3);

  return (
    <GlassCard
      plain={light}
      className={`relative flex flex-col gap-4 p-4 ${light ? '' : isJev ? 'glow-jev' : 'glow-bot'}`}
      as="section"
      aria-label={isJev ? 'Jev panel' : 'Chatbot AI panel'}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold" style={{ color: accent }}>
          {isJev ? 'Jev' : 'Chatbot AI (LLM)'}
          <span className={`ml-2 font-mono text-[10px] uppercase tracking-[0.16em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
            {isJev ? 'decision model' : 'text generator'}
          </span>
        </h3>
        {simulated ? <SimulatedBadge light={light} /> : null}
      </header>

      {/* Incoming queue */}
      <div className={`rounded-xl border p-2.5 ${light ? 'border-[#E4E0D6] bg-[#F7F5F0]' : 'border-white/8 bg-black/25'}`}>
        <div className={`font-mono text-[10px] uppercase tracking-[0.16em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
          Incoming queue · {Math.max(0, TICKETS.length - state.results.length)} left
        </div>
        <div className="mt-2 space-y-1.5">
          {state.current ? (
            <motion.div
              key={state.current.id}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className={`truncate rounded-lg border px-2 py-1.5 text-xs ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}
              style={{ borderColor: `${accent}66`, background: `${accent}14` }}
            >
              <span className={`font-mono text-[10px] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>#{state.current.id}</span>{' '}
              {state.current.text}
            </motion.div>
          ) : (
            <div className={`rounded-lg border border-dashed px-2 py-1.5 text-xs ${light ? 'border-[#E4E0D6] text-[#3E4A5C]' : 'border-white/10 text-slate-500'}`}>
              {stats.finished ? 'Queue empty' : 'Waiting…'}
            </div>
          )}
          {queued.slice(state.current ? 1 : 0, 3).map((t) => (
            <div
              key={t.id}
              className={`truncate rounded-lg border px-2 py-1 text-[11px] ${
                light ? 'border-[#E4E0D6] bg-[#FDFCFA] text-[#3E4A5C]' : 'border-white/6 bg-white/[0.02] text-slate-500'
              }`}
            >
              <span className="font-mono text-[10px]">#{t.id}</span> {t.text}
            </div>
          ))}
        </div>
      </div>

      {/* Flight path */}
      <div className="relative h-20">
        <AnimatePresence>
          {flying ? (
            <motion.div
              key={flying.ticket.id}
              initial={reduced ? { opacity: 1 } : { y: -28, opacity: 0, scale: 0.9 }}
              animate={reduced ? { opacity: 1 } : { y: 26, opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { y: 54, opacity: 0, scale: 0.85 }}
              transition={{ duration: Math.max(0.12, 0.45 / speed), ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-x-6 top-0 rounded-xl border p-2.5 shadow-lg ${light ? 'bg-[#FDFCFA]' : 'bg-[var(--color-hull)]/90'}`}
              style={{
                borderColor: LABEL_STYLES[flying.label].color,
                boxShadow: light ? 'none' : `0 0 26px -8px ${LABEL_STYLES[flying.label].color}`,
              }}
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className={`truncate ${light ? 'text-[#141B2E]' : 'text-slate-200'}`}>#{flying.ticket.id} {flying.ticket.text}</span>
                <span
                  className="shrink-0 font-mono text-[10px] font-bold"
                  style={{ color: LABEL_STYLES[flying.label].color }}
                >
                  {LABEL_STYLES[flying.label].short}
                </span>
              </div>

              {/* Only Jev reports a confidence number. */}
              {isJev && flying.confidence !== null ? (
                <div className="mt-1.5">
                  <div className={`h-1.5 overflow-hidden rounded-full ${light ? 'bg-[#E4E0D6]' : 'bg-white/10'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${flying.confidence * 100}%` }}
                      transition={{ duration: 0.25 }}
                      className="h-full rounded-full"
                      style={{
                        background: flying.flagged
                          ? 'var(--color-human)'
                          : light
                            ? '#00897B'
                            : 'linear-gradient(90deg, var(--color-jev-deep), var(--color-jev))',
                      }}
                    />
                  </div>
                  <div className={`mt-1 flex items-center justify-between font-mono text-[9px] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
                    <span>confidence {(flying.confidence * 100).toFixed(0)}%</span>
                    {flying.flagged ? (
                      <span className="text-[var(--color-human)]">
                        ⚑ Not sure, sending to human
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Finish burst */}
        <AnimatePresence>
          {stats.finished ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 grid place-items-center"
            >
              <span
                className="rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em]"
                style={{ borderColor: accent, color: accent, boxShadow: light ? 'none' : `0 0 30px -8px ${accent}` }}
              >
                Finished!
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <Bins results={state.results} showHumanBin={isJev} onSelect={onSelect} light={light} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Engine time" tone={isJev ? 'jev' : 'bot'} light={light}>
          <Counter value={stats.elapsed} format={ms} />
        </Stat>
        <Stat label="Done" light={light}>
          <Counter value={stats.done} format={(v) => `${Math.round(v)}/${stats.total}`} />
        </Stat>
        <Stat label="Cost" light={light}>
          <Counter value={stats.cost} format={money} />
        </Stat>
        <Stat label="Accuracy" light={light}>
          {stats.accuracy === null ? '—' : (
            <Counter value={stats.accuracy * 100} format={(v) => `${v.toFixed(1)}%`} />
          )}
        </Stat>
      </div>

      <p className={`text-[11px] ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>
        {isJev ? (
          <>
            Accuracy counts the {stats.decided} messages Jev decided.{' '}
            <span className="text-[var(--color-human)]">{stats.flagged}</span> were below the 70%
            confidence line and went to a human instead of a bin.
          </>
        ) : (
          'The chatbot returns a label with no confidence value, so every message goes into a bin — including the ones it gets wrong.'
        )}
      </p>
    </GlassCard>
  );
}
