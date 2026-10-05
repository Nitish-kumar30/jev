import { useState } from 'react';
import { Counter } from '../../components/ui.jsx';
import { formatUsd } from '../../lib/routerEngines.js';
import { ROUTER_REQUESTS } from '../../data/routerRequests.js';

const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;
const pct = (v) => `${(v * 100).toFixed(1)}%`;

/**
 * Running totals for the two strategies and a cumulative-cost chart. The
 * chart is plain SVG: two 2px lines on one $ axis, a legend, direct labels at
 * the line ends, a hover crosshair with a tooltip, and a table view.
 */
export default function CostRace({ score, scaleMax, simulated, liveEstimated, t }) {
  return (
    <section aria-label="Cost comparison" className={`flex flex-col gap-4 rounded-2xl p-4 ${t.card}`}>
      <div className="grid grid-cols-2 gap-3">
        <Total
          t={t}
          color={t.chart.powerful}
          title="Everything → powerful"
          value={score.baselineCost}
          time={score.baselineMs}
          timeNote={simulated || liveEstimated ? 'model time, simulated' : 'model time'}
        />
        <Total
          t={t}
          color={t.chart.fast}
          title="Jev routing"
          value={score.routedCost}
          time={score.routedMs}
          timeNote="routing + model time"
        />
      </div>

      <div className={`flex items-baseline justify-between gap-3 rounded-xl px-3 py-2.5 ${t.inset}`}>
        <span className={t.label}>Saved so far</span>
        <span className={`font-mono text-lg font-semibold tabular-nums ${t.text}`}>
          <Counter value={score.savings} format={formatUsd} />
          <span className={`ml-2 text-sm ${t.muted}`}>
            (<Counter value={score.savingsPct} format={pct} />)
          </span>
        </span>
      </div>

      <CumulativeChart score={score} scaleMax={scaleMax} t={t} />

      {liveEstimated ? (
        <p className={`text-[11px] leading-relaxed ${t.muted}`}>
          Live routing is real; model costs are estimated from each request's token counts at list
          price, because “Answer each request” is off.
        </p>
      ) : null}
    </section>
  );
}

function Total({ t, color, title, value, time, timeNote }) {
  return (
    <div className={`rounded-xl p-3 ${t.inset}`}>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
        <span className={`text-xs font-semibold ${t.body}`}>{title}</span>
      </div>
      <div className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums sm:text-3xl ${t.text}`}>
        <Counter value={value} format={formatUsd} />
      </div>
      <div className={`mt-0.5 font-mono text-[11px] tabular-nums ${t.muted}`}>
        <Counter value={time} format={seconds} /> {timeNote}
      </div>
    </div>
  );
}

const W = 340;
const H = 180;
const PAD = { l: 46, r: 64, t: 10, b: 24 };

function CumulativeChart({ score, scaleMax, t }) {
  const [hover, setHover] = useState(null);
  const n = ROUTER_REQUESTS.length;
  const pts = score.cumulative;
  const yMax = Math.max(scaleMax, pts.length ? pts[pts.length - 1].baseline : 0) * 1.05 || 1;

  const x = (i) => PAD.l + (i / n) * (W - PAD.l - PAD.r);
  const y = (v) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b);
  const path = (key) =>
    [`M${x(0)},${y(0)}`, ...pts.map((p, i) => `L${x(i + 1)},${y(p[key])}`)].join(' ');

  const ticks = [0, 0.5, 1].map((f) => f * yMax / 1.05);
  const last = pts[pts.length - 1];
  const gridStroke = t.light ? '#E4E0D6' : 'rgba(255,255,255,0.08)';
  const axisText = t.light ? '#3E4A5C' : '#94a3b8';

  const onMove = (e) => {
    if (!pts.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * n);
    setHover(Math.min(pts.length, Math.max(1, i)));
  };

  const hp = hover ? pts[hover - 1] : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h4 className={`text-xs font-semibold ${t.body}`}>Cumulative cost per request</h4>
        <div className="flex gap-3" aria-hidden="true">
          <Legend color={t.chart.powerful} label="All powerful" t={t} />
          <Legend color={t.chart.fast} label="Jev routing" t={t} />
        </div>
      </div>

      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={
            last
              ? `Cumulative cost after ${pts.length} requests: everything to powerful ${formatUsd(last.baseline)}, Jev routing ${formatUsd(last.routed)}.`
              : 'Cumulative cost chart, empty until the run starts.'
          }
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={gridStroke} strokeWidth="1" />
              <text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill={axisText} className="font-mono tabular-nums">
                {formatUsd(v)}
              </text>
            </g>
          ))}
          {[1, 6, 12, 18, 24].map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill={axisText} className="font-mono tabular-nums">
              #{i}
            </text>
          ))}

          {hp ? <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke={axisText} strokeWidth="1" strokeDasharray="3 3" /> : null}

          <path d={path('baseline')} fill="none" stroke={t.chart.powerful} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <path d={path('routed')} fill="none" stroke={t.chart.fast} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {hp ? (
            <>
              <circle cx={x(hover)} cy={y(hp.baseline)} r="4" fill={t.chart.powerful} stroke={t.light ? '#FDFCFA' : '#0d1226'} strokeWidth="2" />
              <circle cx={x(hover)} cy={y(hp.routed)} r="4" fill={t.chart.fast} stroke={t.light ? '#FDFCFA' : '#0d1226'} strokeWidth="2" />
            </>
          ) : null}

          {/* Direct labels at the line ends, in text colour beside the mark. */}
          {last ? (
            <>
              <text x={x(pts.length) + 6} y={y(last.baseline) + 3} fontSize="9" fill={axisText} className="font-mono tabular-nums">
                {formatUsd(last.baseline)}
              </text>
              <text
                x={x(pts.length) + 6}
                y={Math.max(y(last.routed) + 3, y(last.baseline) + 14)}
                fontSize="9"
                fill={axisText}
                className="font-mono tabular-nums"
              >
                {formatUsd(last.routed)}
              </text>
            </>
          ) : null}
        </svg>

        {hp ? (
          <div
            className={`pointer-events-none absolute top-0 z-10 rounded-lg px-2.5 py-1.5 text-[11px] shadow-lg ${
              t.light ? 'border border-[#E4E0D6] bg-white text-[#141B2E]' : 'border border-white/10 bg-[#0d1226]/95 text-slate-100'
            }`}
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: hover > n / 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
            }}
          >
            <div className={`font-mono text-[10px] ${t.muted}`}>After request #{hover}</div>
            <TipRow color={t.chart.powerful} label="All powerful" value={hp.baseline} />
            <TipRow color={t.chart.fast} label="Jev routing" value={hp.routed} />
          </div>
        ) : null}
      </div>

      <details className={`mt-2 text-[11px] ${t.muted}`}>
        <summary className="cursor-pointer select-none">Show as a table</summary>
        <div className="mt-2 max-h-40 overflow-y-auto">
          <table className="w-full text-left font-mono tabular-nums">
            <thead>
              <tr>
                <th scope="col" className="py-1 pr-2 font-normal">Request</th>
                <th scope="col" className="py-1 pr-2 font-normal">All powerful</th>
                <th scope="col" className="py-1 font-normal">Jev routing</th>
              </tr>
            </thead>
            <tbody className={t.body}>
              {pts.map((p, i) => (
                <tr key={i}>
                  <td className="py-0.5 pr-2">#{i + 1}</td>
                  <td className="py-0.5 pr-2">{formatUsd(p.baseline)}</td>
                  <td className="py-0.5">{formatUsd(p.routed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Legend({ color, label, t }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] ${t.muted}`}>
      <span className="h-0.5 w-4 rounded" style={{ background: color }} />
      {label}
    </span>
  );
}

function TipRow({ color, label, value }) {
  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span>{label}</span>
      <span className="ml-auto pl-3 font-mono tabular-nums">{formatUsd(value)}</span>
    </div>
  );
}
