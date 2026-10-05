import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import RacePanel from './RacePanel.jsx';
import ResultsCard from './ResultsCard.jsx';
import DetailDrawer from './DetailDrawer.jsx';
import { useRace } from './useRace.js';
import { SPEED_OPTIONS } from '../../lib/constants.js';
import { useMode } from '../../lib/ModeContext.jsx';
import TabHelp from '../../components/TabHelp.jsx';

export default function RaceTab({ light = false }) {
  const { isDemo, isLive, fallbackToDemo } = useMode();
  const [selected, setSelected] = useState(null); // { engine, item }

  const onLiveFailure = useCallback(
    (err) => fallbackToDemo(`Live request failed: ${err.message}`),
    [fallbackToDemo]
  );

  const { status, speed, setSpeed, sides, stats, speedup, start, reset } = useRace({
    live: isLive,
    onLiveFailure,
  });

  const running = status === 'running';

  return (
    <div className="space-y-5">
      <div className="relative text-center">
        <div className="sm:px-28">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ticket Sorting Race</h2>
          <p className={`mx-auto mt-2 max-w-2xl text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-400'}`}>
            The same 50 customer messages go to both engines. Each one sorts them into Billing,
            Technical, Refund or Spam — one message at a time, so you can watch the difference.
          </p>
        </div>
        <div className="mt-3 flex justify-center sm:absolute sm:right-0 sm:top-1 sm:mt-0">
          <TabHelp id="race" light={light} />
        </div>
      </div>

      {/* Controls */}
      <div
        className={`flex flex-wrap items-center justify-center gap-4 rounded-2xl p-4 ${
          light ? 'border border-[#E4E0D6] bg-[#FDFCFA]' : 'glass'
        }`}
      >
        <motion.button
          type="button"
          onClick={start}
          disabled={running}
          whileTap={{ scale: 0.97 }}
          className={`rounded-xl px-7 py-3 text-sm font-bold uppercase tracking-[0.16em] transition disabled:opacity-40 ${
            light
              ? 'bg-[#00897B] text-white'
              : 'bg-gradient-to-r from-[var(--color-jev-deep)] to-[var(--color-jev)] text-[#04060f] shadow-[0_0_40px_-12px_var(--color-jev)]'
          }`}
        >
          {running ? 'Racing…' : status === 'done' ? 'Race again' : 'Start race'}
        </motion.button>

        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Playback speed</legend>
          <span className={`font-mono text-[10px] uppercase tracking-[0.16em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
            Speed
          </span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
                speed === s
                  ? light
                    ? 'border-[#00897B] bg-[#D7F2EC] text-[#00897B]'
                    : 'border-[var(--color-jev)] bg-[var(--color-jev)]/15 text-[var(--color-jev)]'
                  : light
                    ? 'border-[#E4E0D6] text-[#243044] hover:border-[#00897B]'
                    : 'border-white/12 text-slate-300 hover:border-white/30'
              }`}
            >
              {s}×
            </button>
          ))}
        </fieldset>

        <button
          type="button"
          onClick={reset}
          className={`rounded-xl border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
            light
              ? 'border-[#E4E0D6] text-[#243044] hover:border-[#141B2E]'
              : 'border-white/12 text-slate-300 hover:border-white/30'
          }`}
        >
          Reset
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <RacePanel
          side="llm"
          state={sides.llm}
          stats={stats.llm}
          simulated={isDemo}
          speed={speed}
          light={light}
          onSelect={(item) => setSelected({ engine: 'llm', item })}
        />
        <RacePanel
          side="jev"
          state={sides.jev}
          stats={stats.jev}
          simulated={isDemo}
          speed={speed}
          light={light}
          onSelect={(item) => setSelected({ engine: 'jev', item })}
        />
      </div>

      {status === 'done' ? (
        <ResultsCard stats={stats} speedup={speedup} simulated={isDemo} light={light} />
      ) : null}

      <DetailDrawer
        item={selected?.item ?? null}
        engine={selected?.engine}
        onClose={() => setSelected(null)}
        light={light}
      />
    </div>
  );
}
