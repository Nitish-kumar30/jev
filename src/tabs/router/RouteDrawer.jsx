import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { formatUsd } from '../../lib/routerEngines.js';
import { TIER_LABEL } from './theme.js';

/** Detail for one routed request. Esc or the backdrop closes it. */
export default function RouteDrawer({ row, onClose, t }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!row) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [row, onClose]);

  return (
    <AnimatePresence>
      {row ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Routing detail for request ${row.request.id}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={`fixed right-0 top-0 z-50 h-full w-[min(92vw,26rem)] overflow-y-auto rounded-l-2xl p-5 ${
              t.light ? 'border-l border-[#E4E0D6] bg-[#FDFCFA] text-[#141B2E]' : 'glass'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={t.label}>Request #{row.request.id}</div>
                <h4 className={`mt-2 text-sm leading-relaxed ${t.text}`}>{row.request.text}</h4>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close detail"
                className={`rounded-lg border px-2 py-1 ${t.light ? 'border-[#E4E0D6] text-[#243044]' : 'border-white/10 text-slate-300 hover:text-white'}`}
              >
                ×
              </button>
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <Row t={t} label="Jev's choice">
                <Tier t={t} tier={row.jevChoice} />{' '}
                <span className="font-mono tabular-nums">
                  {row.confidence == null ? 'no confidence' : `${(row.confidence * 100).toFixed(1)}%`}
                </span>
              </Row>
              <Row t={t} label="Model used">
                <Tier t={t} tier={row.choice} />
                {row.fellBack ? <span className={`ml-2 text-[11px] ${t.muted}`}>fallback: Jev was unsure</span> : null}
              </Row>
              <Row t={t} label="Correct tier">
                <Tier t={t} tier={row.request.tier} />
                {row.request.borderline ? <span className={`ml-2 text-[11px] ${t.muted}`}>borderline</span> : null}
              </Row>
              <Row t={t} label="Outcome">
                {row.underpowered ? (
                  <span className="font-semibold text-[var(--color-underpowered)]">▼ Underpowered</span>
                ) : row.overspent ? (
                  <span className="font-semibold text-[var(--color-overspent)]">▲ Overspent</span>
                ) : row.fellBack && row.request.tier === 'fast' ? (
                  <span className={t.body}>Deliberate overspend (fallback)</span>
                ) : (
                  <span className="font-semibold text-[var(--color-allow)]">Right-sized</span>
                )}
              </Row>
              <Row t={t} label={`Cost on ${row.choice}`}>
                <span className="font-mono tabular-nums">{formatUsd(row.modelCost)}</span>
                <Estimated t={t} show={!row.measured?.[row.choice]} />
              </Row>
              <Row t={t} label="Cost on powerful">
                <span className="font-mono tabular-nums">{formatUsd(row.baselineCost)}</span>
                <Estimated t={t} show={!row.measured?.powerful} />
              </Row>
              <Row t={t} label="Jev routing">
                <span className="font-mono tabular-nums">
                  {formatUsd(row.routeCost)} · {row.routeLatencyMs.toFixed(0)} ms
                </span>
              </Row>
              <Row t={t} label="Tokens (est.)">
                <span className="font-mono tabular-nums">
                  {row.request.tokens.in.toLocaleString()} in / {row.request.tokens.out.toLocaleString()} out
                </span>
              </Row>
            </dl>

            {row.answer ? (
              <div className="mt-5">
                <div className={t.label}>Model reply</div>
                <p className={`mt-2 whitespace-pre-wrap rounded-xl p-3 text-sm leading-relaxed ${t.inset} ${t.body}`}>{row.answer}</p>
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Row({ t, label, children }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b pb-2 ${t.light ? 'border-[#E4E0D6]' : 'border-white/6'}`}>
      <dt className={t.label}>{label}</dt>
      <dd className={`text-right ${t.text}`}>{children}</dd>
    </div>
  );
}

function Tier({ t, tier }) {
  const color = t.tier[tier];
  return (
    <span
      className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 45%, transparent)` }}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

function Estimated({ t, show }) {
  return show ? <span className={`ml-1.5 text-[10px] ${t.faint}`}>estimated</span> : null;
}
