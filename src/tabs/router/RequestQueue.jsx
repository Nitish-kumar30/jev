import { useEffect, useRef } from 'react';
import { ROUTER_REQUESTS } from '../../data/routerRequests.js';
import { usePrefersReducedMotion } from '../../lib/useReducedMotion.js';

/**
 * The 24 requests as a vertical list. The active one glows; once routed, a
 * card shows Jev's pick and confidence, and a "fallback" tag if one applied.
 */
export default function RequestQueue({ rows, current, onSelect, t }) {
  const listRef = useRef(null);
  const activeRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const byId = new Map(rows.map((r) => [r.request.id, r]));

  // Keep the active card in view inside the list, without scrolling the page.
  useEffect(() => {
    const list = listRef.current;
    const card = activeRef.current;
    if (!list || !card) return;
    list.scrollTo({ top: card.offsetTop - list.offsetTop - 48, behavior: reduced ? 'auto' : 'smooth' });
  }, [current, reduced]);

  return (
    <section aria-label="Request queue" className={`flex min-h-0 flex-col rounded-2xl p-4 ${t.card}`}>
      <div className="flex items-baseline justify-between">
        <h3 className={`text-sm font-semibold ${t.text}`}>Incoming requests</h3>
        <span className={t.label}>
          {rows.length}/{ROUTER_REQUESTS.length} routed
        </span>
      </div>

      <ol ref={listRef} className="relative mt-3 max-h-[34rem] space-y-1.5 overflow-y-auto pr-1">
        {ROUTER_REQUESTS.map((req) => {
          const row = byId.get(req.id);
          const active = current?.id === req.id;
          return (
            <li key={req.id} ref={active ? activeRef : null}>
              <button
                type="button"
                disabled={!row}
                onClick={() => row && onSelect(row)}
                className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                  active
                    ? t.light
                      ? 'border-[#00897B] bg-[#D7F2EC] shadow-[0_0_0_3px_rgba(0,137,123,0.15)]'
                      : 'border-[var(--color-jev)] bg-[var(--color-jev)]/10 shadow-[0_0_22px_-6px_var(--color-jev)]'
                    : row
                      ? t.light
                        ? 'border-[#E4E0D6] bg-white hover:border-[#9AA3B2]'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                      : t.light
                        ? 'border-[#E4E0D6] bg-[#F7F5F0]'
                        : 'border-white/6 bg-transparent'
                } ${!row && !active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 font-mono text-[10px] tabular-nums ${t.faint}`}>#{req.id}</span>
                  <span className={`min-w-0 flex-1 ${row || active ? t.text : t.muted}`}>{req.text}</span>
                </div>
                {row ? <JevChip row={row} t={t} /> : active ? (
                  <div className={`mt-1 pl-6 font-mono text-[10px] ${t.muted}`}>Jev is routing…</div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function JevChip({ row, t }) {
  const color = t.tier[row.choice];
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-6">
      <span
        className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold"
        style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 45%, transparent)` }}
      >
        Jev → {row.jevChoice} · {row.confidence == null ? 'n/a' : row.confidence.toFixed(2)}
      </span>
      {row.fellBack ? (
        <span className="rounded-md border border-dashed px-1.5 py-0.5 font-mono text-[10px] font-semibold" style={{ color: t.tier.powerful, borderColor: t.tier.powerful }}>
          fallback → powerful
        </span>
      ) : null}
    </div>
  );
}
