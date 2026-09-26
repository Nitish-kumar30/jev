import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { HUMAN_REVIEW, LABEL_STYLES } from '../../data/tickets.js';

/** Side drawer opened by clicking any card sitting in a bin. */
export default function DetailDrawer({ item, engine, onClose, light = false }) {
  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  const correct = item && item.label === item.ticket.label;

  return (
    <AnimatePresence>
      {item ? (
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
            aria-label="Message detail"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={`fixed right-0 top-0 z-50 h-full w-[min(92vw,24rem)] overflow-y-auto rounded-l-2xl p-5 ${
              light ? 'border-l border-[#E4E0D6] bg-[#FDFCFA] text-[#141B2E]' : 'glass'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`font-mono text-[10px] uppercase tracking-[0.2em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
                  Message #{item.ticket.id} · {engine === 'jev' ? 'Jev' : 'Chatbot AI'}
                </div>
                <h4 className={`mt-2 text-sm leading-relaxed ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>{item.ticket.text}</h4>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close detail"
                className={`rounded-lg border px-2 py-1 ${light ? 'border-[#E4E0D6] text-[#243044] hover:text-[#141B2E]' : 'border-white/10 text-slate-300 hover:text-white'}`}
              >
                ×
              </button>
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <Row light={light} label="Predicted">
                <Chip label={item.label} />
                {item.label === HUMAN_REVIEW ? (
                  <span className="ml-2 text-[11px] text-[var(--color-human)]">
                    below the confidence line
                  </span>
                ) : null}
              </Row>
              <Row light={light} label="Correct label">
                <Chip label={item.ticket.label} />
              </Row>
              <Row light={light} label="Outcome">
                {item.label === HUMAN_REVIEW ? (
                  <span className="text-[var(--color-human)]">Sent to a human</span>
                ) : correct ? (
                  <span className="text-[var(--color-allow)]">Right</span>
                ) : (
                  <span className="text-[var(--color-spam)]">Wrong</span>
                )}
              </Row>
              <Row light={light} label="Confidence">
                {item.confidence === null ? (
                  <span className={`text-slate-500 ${light ? 'text-[#3E4A5C]' : ''}`}>Not reported by a chatbot</span>
                ) : (
                  <span className="font-mono">{(item.confidence * 100).toFixed(1)}%</span>
                )}
              </Row>
              <Row light={light} label="Time taken">
                <span className="font-mono">{item.latencyMs.toFixed(1)} ms</span>
              </Row>
              <Row light={light} label="Cost">
                <span className="font-mono">${item.cost.toFixed(5)}</span>
              </Row>
              {item.ticket.ambiguous ? (
                <p className={`pt-2 text-[11px] leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-400'}`}>
                  This message is deliberately ambiguous — it could reasonably belong to two bins.
                </p>
              ) : null}
            </dl>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Row({ label, children, light = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b pb-2 ${light ? 'border-[#E4E0D6]' : 'border-white/6'}`}>
      <dt className={`font-mono text-[10px] uppercase tracking-[0.14em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>{label}</dt>
      <dd className={`text-right ${light ? 'text-[#141B2E]' : 'text-slate-200'}`}>{children}</dd>
    </div>
  );
}

function Chip({ label }) {
  const style = LABEL_STYLES[label];
  return (
    <span
      className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color: style.color, background: `${style.color}1f`, border: `1px solid ${style.color}55` }}
    >
      {label}
    </span>
  );
}
