import JevResult from './JevResult.jsx';
import { Reveal } from './ScenePanel.jsx';
import { SimulatedBadge } from '../../components/ui.jsx';
import { PII_FIELDS } from '../../data/piiMessages.js';
import { formatCost, formatSeconds } from './format.js';

/**
 * Scene 03: both answers shrunk side by side. The threshold slider only acts
 * on Jev — the LLM gave true/false, so there is nothing to threshold.
 */
export default function SideBySide({ result, threshold, onThreshold, progress, simulated, light }) {
  const { llm, jev } = result;
  const ratio = jev.ms > 0 ? llm.ms / jev.ms : null;
  const ratioText = ratio === null ? null : ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1);

  const text = light ? 'text-[#141B2E]' : 'text-slate-100';
  const muted = light ? 'text-[#3E4A5C]' : 'text-slate-400';
  const frame = light ? 'border border-[#E4E0D6] bg-[#FDFCFA]' : 'glass';

  return (
    <div className={`rounded-3xl p-5 sm:p-7 ${frame}`}>
      <div className="font-mono text-xs tracking-[0.2em]" style={{ color: light ? '#3E4A5C' : 'rgb(148 163 184)' }}>
        03
      </div>
      <h3 className={`mt-1 text-xl font-semibold tracking-tight sm:text-2xl ${text}`}>Side by side</h3>

      {result.message ? (
        <div
          className={`mt-4 rounded-xl px-4 py-3 ${
            light ? 'border border-[#E4E0D6] bg-white' : 'border border-white/10 bg-black/20'
          }`}
        >
          <p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${muted}`}>Message checked</p>
          <p className={`mt-1.5 break-words font-mono text-[13px] leading-relaxed ${text}`}>{result.message}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Reveal progress={progress.llm}>
          <Column
            light={light}
            accent="llm"
            header="LLM"
            time={formatSeconds(llm.ms)}
            simulated={simulated}
            rows={[
              ['Output', 'prose + JSON you have to parse'],
              ['Certainty', 'no per-field certainty'],
              ...(llm.cost != null ? [['Cost', formatCost(llm.cost)]] : []),
            ]}
          >
            <Reveal progress={progress.rows}>
              {llm.parseFailed ? (
                <p className="font-mono text-xs text-[var(--color-spam)]">parse failed — no fields to show</p>
              ) : (
                <dl className="space-y-2">
                  {PII_FIELDS.map(({ key }) => (
                    <div key={key} className="flex items-baseline justify-between gap-3">
                      <dt className={`font-mono text-xs ${muted}`}>{key}</dt>
                      <dd
                        className={`font-mono text-xl font-semibold ${
                          llm.structured?.[key]
                            ? light ? 'text-[var(--color-pii-llm-ink)]' : 'text-[var(--color-pii-llm)]'
                            : muted
                        }`}
                      >
                        {String(llm.structured?.[key] ?? 'missing')}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className={`mt-4 text-xs leading-relaxed ${muted}`}>
                Nothing to threshold: the LLM said true or false, and the slider has nothing to act on.
              </p>
            </Reveal>
          </Column>
        </Reveal>

        <Reveal progress={progress.jev}>
          <Column
            light={light}
            accent="jev"
            header="jev // noul"
            time={formatSeconds(jev.ms)}
            badge={ratioText ? `${ratioText}× faster` : null}
            simulated={simulated}
            rows={[
              ['Output', 'three typed probabilities'],
              ['Certainty', 'a probability per field'],
              ...(jev.cost != null ? [['Cost', formatCost(jev.cost)]] : []),
            ]}
          >
            <Reveal progress={progress.rows}>
              <JevResult answers={jev.answers} fill={1} light={light} threshold={threshold} compact />
              <label className={`mt-5 block text-xs ${muted}`} htmlFor="pii-threshold">
                Count as PII at or above{' '}
                <span className={`font-mono font-semibold tabular-nums ${text}`}>{threshold.toFixed(2)}</span>
              </label>
              <input
                id="pii-threshold"
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => onThreshold(Number(e.target.value))}
                className={`mt-2 w-full ${light ? 'accent-[var(--color-pii-jev-olive)]' : 'accent-[var(--color-pii-jev)]'}`}
              />
            </Reveal>
          </Column>
        </Reveal>
      </div>
    </div>
  );
}

function Column({ light, accent, header, time, badge, simulated, rows, children }) {
  const isJev = accent === 'jev';
  const ink = isJev
    ? light ? 'var(--color-pii-jev-ink)' : 'var(--color-pii-jev)'
    : light ? 'var(--color-pii-llm-ink)' : 'var(--color-pii-llm)';
  const card = light
    ? isJev
      ? 'border border-[var(--color-pii-jev-olive)]/35 bg-[var(--color-pii-jev-pale)]'
      : 'border border-[var(--color-pii-llm-ink)]/25 bg-[var(--color-pii-llm-pale)]'
    : isJev
      ? 'border border-[var(--color-pii-jev)]/35 bg-[var(--color-pii-jev)]/[0.04]'
      : 'border border-[var(--color-pii-llm)]/35 bg-[var(--color-pii-llm)]/[0.05]';
  const muted = light ? 'text-[#3E4A5C]' : 'text-slate-400';

  return (
    <section aria-label={header} className={`h-full rounded-2xl p-4 sm:p-5 ${card}`}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-mono text-sm font-semibold" style={{ color: ink }}>
          {header}
        </h4>
        {simulated ? <SimulatedBadge light={light} /> : null}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-4xl font-semibold tabular-nums" style={{ color: ink }}>
          {time}
        </span>
        {badge ? (
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${
              light ? 'bg-[var(--color-pii-jev)] text-[var(--color-pii-jev-ink)]' : 'bg-[var(--color-pii-jev)]/15 text-[var(--color-pii-jev)]'
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <dl className="mt-3 space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-3 text-sm">
            <dt className={`w-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] leading-5 ${muted}`}>{k}</dt>
            <dd className={light ? 'text-[#141B2E]' : 'text-slate-200'}>{v}</dd>
          </div>
        ))}
      </dl>
      <hr className={`my-4 ${light ? 'border-black/10' : 'border-white/10'}`} />
      {children}
    </section>
  );
}
