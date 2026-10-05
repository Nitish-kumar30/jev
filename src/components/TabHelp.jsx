import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TAB_HELP } from '../data/tabHelp.js';

/**
 * Help control for one tab. Opens a short modal: what the tab is, how to use
 * it, and what Demo and Live mode do here.
 */
export default function TabHelp({ id, light = false }) {
  const help = TAB_HELP[id];
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!help) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
          light
            ? 'border-[#E4E0D6] bg-[#FDFCFA] text-[#141B2E] hover:border-[#00897B]'
            : 'border-white/15 bg-white/[0.04] text-slate-200 hover:border-white/35'
        }`}
      >
        <span
          aria-hidden="true"
          className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold ${
            light ? 'bg-[#D7F2EC] text-[#00897B]' : 'bg-[var(--color-jev)]/20 text-[var(--color-jev)]'
          }`}
        >
          ?
        </span>
        Help
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={close}>
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className={`max-h-[min(85vh,40rem)] w-full max-w-lg overflow-y-auto rounded-2xl p-5 text-left shadow-2xl ${
                  light
                    ? 'border border-[#E4E0D6] bg-[#FDFCFA] text-[#141B2E]'
                    : 'border border-white/12 bg-[var(--color-abyss)] text-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                        light ? 'text-[#00897B]' : 'text-[var(--color-jev)]'
                      }`}
                    >
                      About this tab
                    </p>
                    <h3 id={titleId} className="mt-1 text-lg font-semibold tracking-tight">
                      {help.title}
                    </h3>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={close}
                    className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                      light
                        ? 'border-[#E4E0D6] text-[#141B2E] hover:border-[#141B2E]'
                        : 'border-white/15 text-slate-200 hover:border-white/40'
                    }`}
                  >
                    Close
                  </button>
                </div>

                <p className={`mt-4 text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-300'}`}>
                  {help.about}
                </p>

                <h4 className={`mt-5 text-sm font-semibold ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>
                  How to use it
                </h4>
                <ol className={`mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-300'}`}>
                  {help.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>

                <h4 className={`mt-5 text-sm font-semibold ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>
                  Demo and Live
                </h4>
                <p className={`mt-2 text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-300'}`}>
                  {help.modes}
                </p>
              </motion.div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
