import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import RequestQueue from './RequestQueue.jsx';
import Lanes from './Lanes.jsx';
import CostRace from './CostRace.jsx';
import RouterSummary, { summarySentence } from './RouterSummary.jsx';
import RouteDrawer from './RouteDrawer.jsx';
import { useRouter } from './useRouter.js';
import { routerTheme } from './theme.js';
import { SimulatedBadge } from '../../components/ui.jsx';
import { ROUTER_REQUESTS } from '../../data/routerRequests.js';
import { ROUTER_MODELS, SPEED_OPTIONS } from '../../lib/constants.js';
import { priceRequest } from '../../lib/routerEngines.js';
import { useMode } from '../../lib/ModeContext.jsx';

/** Every request priced on the powerful model: fixes the chart's y-scale before the run. */
const FULL_BASELINE = ROUTER_REQUESTS.reduce((sum, r) => sum + priceRequest(r.tokens, 'powerful'), 0);

/**
 * Model Router: before each request reaches an LLM, Jev answers one choice
 * question — fast or powerful — and the tab keeps a running cost comparison
 * against sending everything to the powerful model.
 */
export default function RouterTab({ light = false }) {
  const t = routerTheme(light);
  const { isDemo, isLive, fallbackToDemo } = useMode();
  const [selectedId, setSelectedId] = useState(null);

  const onLiveFailure = useCallback(
    (err) => fallbackToDemo(`Live routing failed: ${err.message}`),
    [fallbackToDemo]
  );

  const { status, speed, setSpeed, threshold, setThreshold, current, score, wallMs, total, start, reset } = useRouter({
    live: isLive,
    onLiveFailure,
  });

  const running = status === 'running';
  const models = ROUTER_MODELS;
  const selected = useMemo(
    () => (selectedId == null ? null : score.rows.find((r) => r.request.id === selectedId) ?? null),
    [score.rows, selectedId]
  );

  const restart = () => {
    setSelectedId(null);
    start();
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Model Router</h2>
        <p className={`mx-auto mt-2 max-w-2xl text-sm leading-relaxed ${t.body}`}>
          Jev picks the cheapest model that can do the job. When it isn't sure, it picks the
          powerful one.
        </p>
        <p className={`mx-auto mt-1 max-w-2xl text-xs leading-relaxed ${t.muted}`}>
          Before each request reaches an LLM, Jev answers one question — <span className="font-mono">fast</span> or{' '}
          <span className="font-mono">powerful</span> — with the instruction “Choose the least costly model that can
          complete the task.” The pattern is from LangChain's “Building a harness with Jev”.
        </p>
      </div>

      {/* Header strip */}
      <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl p-4 ${t.card}`}>
        <motion.button
          type="button"
          onClick={restart}
          whileTap={{ scale: 0.97 }}
          className={`rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] ${
            light
              ? 'bg-[#00897B] text-white'
              : 'bg-gradient-to-r from-[var(--color-jev-deep)] to-[var(--color-jev)] text-[#04060f] shadow-[0_0_40px_-12px_var(--color-jev)]'
          }`}
        >
          {running ? 'Start again' : status === 'done' ? 'Run again' : 'Start'}
        </motion.button>
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
            reset();
          }}
          className={`rounded-xl border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] ${
            light ? 'border-[#E4E0D6] text-[#243044] hover:border-[#141B2E]' : 'border-white/12 text-slate-300 hover:border-white/30'
          }`}
        >
          Reset
        </button>

        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Playback speed</legend>
          <span className={t.label}>Speed</span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs ${
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

        <div className="flex items-center gap-2">
          <label htmlFor="router-threshold" className={t.label}>
            Fallback below
          </label>
          <input
            id="router-threshold"
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className={`w-28 ${light ? 'accent-[#00897B]' : 'accent-[var(--color-jev)]'}`}
          />
          <span className={`font-mono text-xs tabular-nums ${t.text}`}>{threshold.toFixed(2)}</span>
        </div>

        <span className={`font-mono text-xs tabular-nums ${t.muted}`} aria-label="Elapsed wall clock">
          {(wallMs / 1000).toFixed(1)}s · {score.done}/{total}
        </span>
        {isDemo ? <SimulatedBadge light={light} /> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,1.05fr)]">
        <RequestQueue rows={score.rows} current={current} onSelect={(r) => setSelectedId(r.request.id)} t={t} />
        <Lanes rows={score.rows} models={models} onSelect={(r) => setSelectedId(r.request.id)} t={t} />
        <CostRace score={score} scaleMax={FULL_BASELINE} simulated={isDemo} liveEstimated={false} t={t} />
      </div>

      {status === 'done' ? (
        <RouterSummary
          score={score}
          threshold={threshold}
          onThreshold={setThreshold}
          simulated={isDemo}
          live={isLive}
          t={t}
        />
      ) : null}

      <div aria-live="polite" className="sr-only">
        {status === 'done' ? `Run finished. ${summarySentence(score, threshold)}` : ''}
      </div>

      <RouteDrawer row={selected} onClose={() => setSelectedId(null)} t={t} />
    </div>
  );
}
