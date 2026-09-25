import { motion } from 'framer-motion';
import { Counter } from '../../components/ui.jsx';
import { DECISIONS } from '../../lib/gateEngine.js';

const R = 62;
const CIRC = Math.PI * R; // semicircle length

/** Semicircular gauge for the gate's confidence value. */
export default function ConfidenceGauge({ value, decision }) {
  const pct = value ?? 0;
  const color = decision ? DECISIONS[decision].color : 'var(--color-jev)';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 92" className="w-full max-w-[220px]" role="img"
        aria-label={value === null ? 'No confidence value yet' : `Confidence ${(value * 100).toFixed(0)} percent`}>
        <path
          d={`M 18 80 A ${R} ${R} 0 0 1 142 80`}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <motion.path
          d={`M 18 80 A ${R} ${R} 0 0 1 142 80`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={false}
          animate={{ strokeDashoffset: CIRC * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* 70% threshold marker */}
        <line x1="80" y1="8" x2="80" y2="22" stroke="rgba(255,255,255,0.35)" strokeWidth="2" transform="rotate(36 80 80)" />
      </svg>
      <div className="-mt-6 text-center">
        <div className="font-mono text-3xl" style={{ color }}>
          {value === null ? '—' : <Counter value={pct * 100} format={(v) => `${v.toFixed(0)}%`} />}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
          Confidence
        </div>
      </div>
    </div>
  );
}
