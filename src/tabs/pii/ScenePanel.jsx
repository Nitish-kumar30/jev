import { SimulatedBadge } from '../../components/ui.jsx';

/**
 * Shared layout for scenes 01 and 02, after the video: a "Your app" card on
 * the left, an arrow, and the model's card on the right, with a big timer in
 * the top-right corner and a caption pill in the bottom-left.
 */
export default function ScenePanel({
  accent,
  number,
  title,
  timer,
  caption,
  captionProgress,
  left,
  rightHeader,
  right,
  arrowProgress,
  simulated,
  light,
}) {
  const isJev = accent === 'jev';
  const ink = isJev
    ? light ? 'var(--color-pii-jev-ink)' : 'var(--color-pii-jev)'
    : light ? 'var(--color-pii-llm-ink)' : 'var(--color-pii-llm)';

  const frame = light
    ? 'border border-[#E4E0D6] bg-[#FDFCFA]'
    : 'glass';
  const rightCard = light
    ? isJev
      ? 'border border-[var(--color-pii-jev-olive)]/35 bg-[var(--color-pii-jev-pale)]'
      : 'border border-[var(--color-pii-llm-ink)]/25 bg-[var(--color-pii-llm-pale)]'
    : isJev
      ? 'border border-[var(--color-pii-jev)]/35 bg-[var(--color-pii-jev)]/[0.04]'
      : 'border border-[var(--color-pii-llm)]/35 bg-[var(--color-pii-llm)]/[0.05]';
  const leftCard = light ? 'border border-[#E4E0D6] bg-white' : 'border border-white/10 bg-black/25';

  return (
    <div className={`relative rounded-3xl p-5 sm:p-7 ${frame}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs tracking-[0.2em]" style={{ color: ink }}>
            {number}
          </div>
          <h3 className={`mt-1 text-xl font-semibold tracking-tight sm:text-2xl ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>
            {title}
          </h3>
        </div>
        <div
          className="font-mono text-4xl font-semibold tabular-nums sm:text-5xl"
          style={{ color: ink }}
          aria-label={`Elapsed ${timer}`}
        >
          {timer}
        </div>
      </div>

      <div className="mt-6 grid items-stretch gap-3 md:grid-cols-[1fr_4rem_1fr] md:gap-2">
        <section aria-label="Your app" className={`rounded-2xl p-4 sm:p-5 ${leftCard}`}>
          <h4 className={`text-sm font-semibold ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>Your app</h4>
          <div className="mt-3 space-y-4">{left}</div>
        </section>

        <Arrow progress={arrowProgress} color={ink} />

        <section aria-label={rightHeader} className={`rounded-2xl p-4 sm:p-5 ${rightCard}`}>
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-mono text-sm font-semibold" style={{ color: ink }}>
              {rightHeader}
            </h4>
            {simulated ? <SimulatedBadge light={light} /> : null}
          </div>
          <div className="mt-3">{right}</div>
        </section>
      </div>

      <div className="mt-5 flex min-h-[2.25rem] items-center">
        <span
          className={`rounded-full px-4 py-1.5 font-mono text-xs font-semibold ${
            light
              ? isJev
                ? 'bg-[var(--color-pii-jev)] text-[var(--color-pii-jev-ink)]'
                : 'bg-[var(--color-pii-llm-ink)] text-white'
              : isJev
                ? 'bg-[var(--color-pii-jev)]/15 text-[var(--color-pii-jev)] ring-1 ring-[var(--color-pii-jev)]/40'
                : 'bg-[var(--color-pii-llm)]/15 text-[var(--color-pii-llm)] ring-1 ring-[var(--color-pii-llm)]/40'
          }`}
          style={{ opacity: captionProgress, transform: `translateY(${(1 - captionProgress) * 6}px)` }}
        >
          {caption}
        </span>
      </div>
    </div>
  );
}

/** Draws itself as progress goes 0 → 1. Points right on wide screens, down on phones. */
function Arrow({ progress, color }) {
  const dash = { strokeDasharray: 1, strokeDashoffset: 1 - progress };
  const head = { opacity: progress >= 0.95 ? 1 : 0 };
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 64 24" className="hidden h-6 w-16 md:block">
        <path d="M4 12 H54" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" pathLength="1" style={dash} />
        <path d="M48 5 L56 12 L48 19" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={head} />
      </svg>
      <svg viewBox="0 0 24 40" className="h-10 w-6 md:hidden">
        <path d="M12 3 V31" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" pathLength="1" style={dash} />
        <path d="M5 25 L12 33 L19 25" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={head} />
      </svg>
    </div>
  );
}

/** Fade-and-rise driven by a 0..1 timeline value. */
export function Reveal({ progress, children, className = '' }) {
  return (
    <div
      className={className}
      style={{ opacity: progress, transform: `translateY(${(1 - progress) * 6}px)` }}
    >
      {children}
    </div>
  );
}

/** Small mono section label used inside the cards ("instructions", "state"). */
export function FieldLabel({ children, light }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
      {children}
    </div>
  );
}
