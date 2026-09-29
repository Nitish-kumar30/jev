import { useEffect, useRef, useState } from 'react';
import { GlassCard, Stat } from '../../components/ui.jsx';
import { useMode } from '../../lib/ModeContext.jsx';
import { runExample } from '../../lib/api.js';
import CodePanel from './CodePanel.jsx';
import { EXAMPLES } from './snippets.js';

function money(cost) {
  return cost == null || Number.isNaN(Number(cost)) ? 'not reported' : `$${Number(cost).toFixed(8)}`;
}

function latency(ms) {
  return ms == null ? '—' : `${Math.round(ms)} ms`;
}

function Side({ title, tone, data, light }) {
  const accent =
    tone === 'jev'
      ? light
        ? 'text-[#0F766E]'
        : 'text-[var(--color-jev)]'
      : light
        ? 'text-[#C2410C]'
        : 'text-[var(--color-bot)]';
  const ring =
    tone === 'jev'
      ? light
        ? 'border-[#0F766E]'
        : 'border-[var(--color-jev)]/30'
      : light
        ? 'border-[#C2410C]'
        : 'border-[var(--color-bot)]/35';

  return (
    <div className={`rounded-xl border p-3 ${ring} ${light ? 'bg-white' : 'bg-black/25'}`}>
      <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${accent}`}>{title}</div>
      {data?.absent ? (
        <p className={`mt-3 text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-300'}`}>{data.absent}</p>
      ) : null}
      {data?.prose ? (
        <p className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed ${light ? 'text-[#0F1724]' : 'text-slate-100'}`}>
          {data.prose}
        </p>
      ) : null}
      {data?.rows?.length ? (
        <dl className="mt-3 space-y-2">
          {data.rows.map((row, index) => (
            <div key={`${row.label}-${index}`} className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
              <dt className={`font-mono text-[11px] ${light ? 'text-[#1F2937]' : 'text-slate-400'}`}>{row.label}</dt>
              <dd
                className={`break-words font-mono leading-relaxed ${
                  row.emphasis === 'fail'
                    ? 'text-[var(--color-block)]'
                    : light
                      ? 'text-sm text-[#0F1724]'
                      : 'text-[12px] text-slate-100'
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {data?.note ? (
        <p className={`mt-3 text-xs leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-400'}`}>{data.note}</p>
      ) : null}
      {data && (data.ms != null || data.cost != null) ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Time" tone={tone} light={light}>
            {latency(data.ms)}
          </Stat>
          <Stat label="Cost" tone={tone} light={light}>
            <span className="text-sm">{money(data.cost)}</span>
          </Stat>
        </div>
      ) : null}
    </div>
  );
}

function Round({ round, light }) {
  return (
    <div className="space-y-3">
      {round.caption ? (
        <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${light ? 'text-[#243044]' : 'text-slate-400'}`}>
          {round.caption}
        </div>
      ) : null}
      {round.input ? (
        <p
          className={`whitespace-pre-wrap rounded-xl border px-3 py-2 text-sm leading-relaxed ${
            light ? 'border-[#C9C3B6] bg-white text-[#0F1724]' : 'border-white/10 bg-black/30 text-slate-200'
          }`}
        >
          {round.input}
        </p>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-2">
        <Side title="Chat LLM" tone="bot" data={round.llm} light={light} />
        <Side title="Jev" tone="jev" data={round.jev} light={light} />
      </div>
    </div>
  );
}

const runButtonClass = (light) =>
  `shrink-0 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] disabled:opacity-60 ${
    light
      ? 'bg-[#00897B] text-white'
      : 'bg-[var(--color-jev)]/20 text-[var(--color-jev)] ring-1 ring-[var(--color-jev)]/50'
  }`;

function ExampleCard({ example, result, error, running, live, light, onRun }) {
  return (
    <article id={`example-${example.n}`} className="scroll-mt-32 space-y-4">
      <GlassCard plain={light} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                light ? 'text-[#00897B]' : 'text-[var(--color-jev)]'
              }`}
            >
              Example {example.n}
              {example.wrongTool ? ' · Jev cannot do this' : ''}
            </div>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">{example.title}</h3>
            <p className={`mt-2 max-w-3xl text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-300'}`}>
              {example.point}
            </p>
          </div>
          <button type="button" onClick={onRun} disabled={running} className={runButtonClass(light)}>
            {running ? 'Running…' : live ? 'Run' : 'Run in Live'}
          </button>
        </div>

        <div className="mt-4">
          <div className={`font-mono text-[10px] uppercase tracking-[0.16em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
            {example.inputLabel}
          </div>
          <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${light ? 'text-[#141B2E]' : 'text-slate-200'}`}>
            {example.input}
          </p>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-[var(--color-block)]" role="alert">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="mt-5 space-y-5" aria-live="polite">
            {result.models ? (
              <p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>
                {result.models.llm} · {result.models.jev}
              </p>
            ) : null}
            {result.rounds?.map((round, index) => (
              <Round key={round.caption || index} round={round} light={light} />
            ))}
            <p className={`text-sm leading-relaxed ${light ? 'text-[#141B2E]' : 'text-slate-200'}`}>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                  light ? 'text-[#00897B]' : 'text-[var(--color-jev)]'
                }`}
              >
                Takeaway{' '}
              </span>
              {example.takeaway}
            </p>
          </div>
        ) : null}
      </GlassCard>

      <CodePanel code={example.code} light={light} />
    </article>
  );
}

export default function ExamplesTab({ light = false }) {
  const { isLive, pushToast, fallbackToDemo } = useMode();
  const [results, setResults] = useState({});
  const [pending, setPending] = useState(() => new Set());
  const [errors, setErrors] = useState({});
  const [runningAll, setRunningAll] = useState(false);
  const [activeExample, setActiveExample] = useState(1);
  const inFlight = useRef(new Set());

  useEffect(() => {
    const nodes = EXAMPLES.map((item) => document.getElementById(`example-${item.n}`)).filter(Boolean);
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const n = Number(visible.target.id.replace('example-', ''));
        if (n) setActiveExample(n);
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0.15, 0.4] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const showExample = (n) => {
    setActiveExample(n);
    document.getElementById(`example-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const markPending = (n, on) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(n);
      else next.delete(n);
      return next;
    });
  };

  const requireLive = () => {
    if (isLive) return true;
    pushToast({
      tone: 'warn',
      title: 'Live mode required',
      body: 'These six examples call the real APIs through the existing backend. Nothing on this tab is simulated.',
    });
    return false;
  };

  /** @returns {'ok' | 'fail' | 'stop'} */
  const runOne = async (n) => {
    if (inFlight.current.has(n)) return 'ok';
    inFlight.current.add(n);
    markPending(n, true);
    setErrors((prev) => ({ ...prev, [n]: '' }));
    try {
      const data = await runExample(n);
      setResults((prev) => ({ ...prev, [n]: data }));
      return 'ok';
    } catch (err) {
      if (err.code === 'missing_key' || err.status === 503) {
        fallbackToDemo(err.message);
        return 'stop';
      }
      setErrors((prev) => ({ ...prev, [n]: err.message }));
      pushToast({ tone: 'warn', title: `Example ${n} failed`, body: err.message });
      return 'fail';
    } finally {
      inFlight.current.delete(n);
      markPending(n, false);
    }
  };

  const run = (n) => {
    if (!requireLive() || pending.has(n)) return;
    runOne(n);
  };

  const runAll = async () => {
    if (!requireLive() || runningAll) return;
    setRunningAll(true);
    try {
      for (const example of EXAMPLES) {
        const outcome = await runOne(example.n);
        if (outcome === 'stop') break;
      }
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:items-start md:gap-8">
      <nav aria-label="Examples" className="mb-6 md:sticky md:top-28 md:mb-0 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto">
        <div
          className={`rounded-2xl border p-2 ${
            light ? 'border-[#E4E0D6] bg-[#FDFCFA]' : 'border-white/10 bg-black/30'
          }`}
        >
          <div
            className={`px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] ${
              light ? 'text-[#3E4A5C]' : 'text-slate-400'
            }`}
          >
            Examples
          </div>
          <ol className="space-y-1">
            {EXAMPLES.map((item) => {
              const current = item.n === activeExample;
              return (
                <li key={item.n}>
                  <button
                    type="button"
                    onClick={() => showExample(item.n)}
                    aria-current={current ? 'true' : undefined}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left text-sm transition ${
                      current
                        ? light
                          ? 'bg-[#D7F2EC] text-[#00897B]'
                          : 'bg-[var(--color-jev)]/15 text-[var(--color-jev)]'
                        : light
                          ? 'text-[#243044] hover:bg-[#F7F5F0]'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="mt-0.5 w-4 shrink-0 font-mono text-xs font-semibold">{item.n}</span>
                    <span className="leading-snug">{item.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      <div className="min-w-0 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Jev vs a chat LLM</h2>
        <p className={`mx-auto mt-2 max-w-2xl text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-400'}`}>
          Six tasks, done both ways. Chat goes to completions and comes back as prose. Jev goes to
          systemone and comes back typed. Example 6 is where Jev routes and the LLM writes.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={runAll} disabled={runningAll} className={runButtonClass(light)}>
            {runningAll ? 'Running all…' : isLive ? 'Run all' : 'Run all in Live'}
          </button>
        </div>
        {!isLive ? (
          <p className={`mx-auto mt-4 max-w-2xl text-xs leading-relaxed ${light ? 'text-[#D97706]' : 'text-amber-200/90'}`}>
            Demo mode does not invent these numbers. Open settings and choose Live — the same OpenRouter
            key and the same Vercel function already used by the other tabs.
          </p>
        ) : null}
      </div>

      {EXAMPLES.map((example) => (
        <ExampleCard
          key={example.n}
          example={example}
          result={results[example.n]}
          error={errors[example.n]}
          running={pending.has(example.n)}
          live={isLive}
          light={light}
          onRun={() => run(example.n)}
        />
      ))}
      </div>
    </div>
  );
}
