import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MODES, useMode } from '../lib/ModeContext';
import { checkBackendHealth } from '../lib/api';

/** Top-right settings popover: the Demo / Live switch lives here. */
export default function SettingsMenu() {
  const { mode, setMode, pushToast } = useMode();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const chooseLive = async () => {
    setChecking(true);
    const health = await checkBackendHealth();
    setChecking(false);
    if (!health.ok) {
      pushToast({
        tone: 'warn',
        title: 'Staying in Demo mode',
        body: health.reason,
      });
      setMode(MODES.DEMO);
      return;
    }
    setMode(MODES.LIVE);
    pushToast({
      title: 'Live mode on',
      body: 'Requests now go through your backend to the real APIs.',
    });
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="glass flex items-center gap-2 rounded-full px-3 py-2 text-xs text-slate-200 transition hover:border-white/25"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            mode === MODES.LIVE
              ? 'bg-[var(--color-allow)] shadow-[0_0_10px_var(--color-allow)]'
              : 'bg-[var(--color-jev)] shadow-[0_0_10px_var(--color-jev)]'
          }`}
        />
        <span className="font-mono uppercase tracking-[0.16em]">
          {mode === MODES.LIVE ? 'Live' : 'Demo'}
        </span>
        <span aria-hidden="true" className="text-slate-400">
          ⚙
        </span>
        <span className="sr-only">Open settings</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label="Settings"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="glass absolute right-0 z-40 mt-2 w-[min(88vw,20rem)] rounded-2xl p-4"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Engine mode
            </div>
            <div className="mt-3 space-y-2">
              <ModeOption
                active={mode === MODES.DEMO}
                title="Demo mode"
                body="Simulated engines with realistic timings. Works offline, no keys."
                onSelect={() => setMode(MODES.DEMO)}
              />
              <ModeOption
                active={mode === MODES.LIVE}
                title={checking ? 'Live mode (checking…)' : 'Live mode'}
                body="Backend calls the real Jev API and a real LLM API."
                onSelect={chooseLive}
              />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Keys live in <code className="font-mono text-slate-300">server/.env</code> only —
              never in the browser. Missing keys fall back to Demo mode.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ModeOption({ active, title, body, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`w-full rounded-xl border p-3 text-left transition ${
        active
          ? 'border-[var(--color-jev)]/60 bg-[var(--color-jev)]/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/25'
      }`}
    >
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{body}</div>
    </button>
  );
}
