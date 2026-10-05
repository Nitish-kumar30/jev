import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import RequestQueue from './RequestQueue.jsx';
import Lanes from './Lanes.jsx';
import CostRace from './CostRace.jsx';
import RouterSummary, { summarySentence } from './RouterSummary.jsx';
import RouteDrawer from './RouteDrawer.jsx';
import { useRouter } from './useRouter.js';
import { routerTheme } from './theme.js';
import { SimulatedBadge } from '../../components/ui.jsx';
import CodePanel from '../examples/CodePanel.jsx';
import { ROUTER_REQUESTS } from '../../data/routerRequests.js';
import { ROUTER_MODELS, SPEED_OPTIONS } from '../../lib/constants.js';
import { priceRequest } from '../../lib/routerEngines.js';
import { useMode } from '../../lib/ModeContext.jsx';
import { checkBackendHealth } from '../../lib/api.js';
import TabHelp from '../../components/TabHelp.jsx';

/** The LangChain harness this tab is recreating. Shown, not executed. */
const ROUTER_SNIPPET = `from langchain.agents import create_agent
from langchain_typesafe.experimental.middleware import (
    ModelChoice,
    ModelRouterMiddleware,
)

router = ModelRouterMiddleware(
    choices={
        "fast": ModelChoice(
            model="openai:luna",
            criteria="Direct lookups, extraction, and localized changes.",
        ),
        "powerful": ModelChoice(
            model="openai:sol",
            criteria="Architecture and high-stakes decisions.",
        ),
    },
    instructions="Choose the least costly model that can complete the task.",
)

agent = create_agent("openai:gpt-5.6-luna", middleware=[router])
`;

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
  const [answer, setAnswer] = useState(false); // real, billed model answers — off by default
  const [liveModels, setLiveModels] = useState(null);

  // In Live mode the lanes show the models the server will actually call.
  useEffect(() => {
    if (!isLive) {
      setLiveModels(null);
      setAnswer(false);
      return;
    }
    let cancelled = false;
    checkBackendHealth().then((h) => {
      if (!cancelled && h.routerModels) setLiveModels(h.routerModels);
    });
    return () => {
      cancelled = true;
    };
  }, [isLive]);

  const onLiveFailure = useCallback(
    (err) => fallbackToDemo(`Live routing failed: ${err.message}`),
    [fallbackToDemo]
  );

  const { status, speed, setSpeed, threshold, setThreshold, current, score, wallMs, total, paused, start, pause, resume, reset } = useRouter({
    live: isLive,
    answer,
    onLiveFailure,
  });

  const running = status === 'running';
  const models = liveModels ?? ROUTER_MODELS;
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
      <div className="relative text-center">
        <div className="sm:px-28">
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
        <div className="mt-3 flex justify-center sm:absolute sm:right-0 sm:top-1 sm:mt-0">
          <TabHelp id="router" light={light} />
        </div>
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
          {running || paused ? 'Start again' : status === 'done' ? 'Run again' : 'Start'}
        </motion.button>
        {isLive ? (
          <button
            type="button"
            onClick={paused ? resume : pause}
            disabled={!running && !paused}
            aria-pressed={paused}
            aria-label={paused ? 'Resume routing' : 'Pause before the next request'}
            className={`rounded-xl border px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-40 ${
              light ? 'border-[#E4E0D6] text-[#243044] hover:border-[#141B2E]' : 'border-white/12 text-slate-300 hover:border-white/30'
            }`}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        ) : null}
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

        <div className="flex basis-full flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={answer}
            disabled={!isLive || running}
            onClick={() => setAnswer((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
              light ? 'border-[#E4E0D6] text-[#243044]' : 'border-white/12 text-slate-300'
            }`}
          >
            <span
              aria-hidden="true"
              className={`relative h-4 w-7 rounded-full ${answer ? (light ? 'bg-[#00897B]' : 'bg-[var(--color-jev)]') : light ? 'bg-[#C9C3B6]' : 'bg-white/20'}`}
            >
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-[left] ${answer ? 'left-3.5' : 'left-0.5'}`} />
            </span>
            Answer each request
          </button>
          <span className={`text-[11px] ${t.muted}`}>
            {!isLive
              ? 'Live mode only. Off by default: it calls a real model for all 24 requests and costs real money.'
              : answer
                ? 'On: each request is really answered by the routed model; its real cost replaces the estimate.'
                : 'Off: Jev routing is real, model costs are estimated from token counts at list price.'}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,1.05fr)]">
        <RequestQueue rows={score.rows} current={current} onSelect={(r) => setSelectedId(r.request.id)} t={t} />
        <Lanes rows={score.rows} models={models} onSelect={(r) => setSelectedId(r.request.id)} t={t} />
        <CostRace score={score} scaleMax={FULL_BASELINE} simulated={isDemo} liveEstimated={isLive && !answer} t={t} />
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

      <CodePanel code={ROUTER_SNIPPET} light={light} />

      <RouteDrawer row={selected} onClose={() => setSelectedId(null)} t={t} />
    </div>
  );
}
