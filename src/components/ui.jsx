import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../lib/useReducedMotion';

export function GlassCard({ className = '', as: Tag = 'div', ...rest }) {
  return <Tag className={`glass rounded-2xl ${className}`} {...rest} />;
}

/** Shown on every panel while the engines are simulated rather than real. */
export function SimulatedBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
      Simulated
    </span>
  );
}

export function Pill({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-300 ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Animated number that eases toward `value`. Falls back to a plain,
 * instantly-updated number when the user prefers reduced motion.
 */
export function Counter({ value, format = (v) => Math.round(v).toString(), className = '' }) {
  const reduced = usePrefersReducedMotion();
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 140, damping: 26, mass: 0.4 });
  const text = useTransform(spring, (v) => format(v));

  useEffect(() => {
    mv.set(value);
  }, [mv, value]);

  if (reduced) return <span className={className}>{format(value)}</span>;
  return <motion.span className={className}>{text}</motion.span>;
}

export function Stat({ label, children, tone = 'default' }) {
  const toneClass =
    tone === 'jev'
      ? 'text-[var(--color-jev)]'
      : tone === 'bot'
        ? 'text-[var(--color-bot)]'
        : 'text-slate-100';
  return (
    <div className="rounded-xl border border-white/8 bg-black/25 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className={`mt-1 font-mono text-lg leading-none ${toneClass}`}>{children}</div>
    </div>
  );
}

export function Toasts({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(92vw,22rem)] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className={`glass pointer-events-auto rounded-xl p-3 text-sm ${
            t.tone === 'warn' ? 'border-amber-300/40' : 'border-cyan-300/30'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-100">{t.title}</div>
              {t.body ? <div className="mt-0.5 text-slate-300">{t.body}</div> : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="rounded px-1 text-slate-400 hover:text-slate-100"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
