import { motion } from 'framer-motion';
import { Counter } from '../../components/ui.jsx';
import { DECISIONS } from '../../lib/gateEngine.js';

const R = 62;
const CIRC = Math.PI * R; // semicircle length

/** Semicircular gauge for the gate's confidence value. */
export default function ConfidenceGauge({ value, decision, light = false }) {
  const pct = value ?? 0;
  const color = decision ? DECISIONS[decision].color : 'var(--color-jev)';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 92" className="w-full max-w-[220px]" role="img"
        aria-label={value === null ? 'No confidence value yet' : `Confidence ${(value * 100).toFixed(0)} percent`}>
        <path
          d={`M 18 80 A ${R} ${R} 0 0 1 142 80`}
          fill="none"
          stroke={light ? '#E4E0D6' : 'rgba(255,255,255,0.1)'}
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
          style={{ filter: light ? 'none' : `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Marker at the 70% confidence threshold (54 degrees up from the right). */}
        <line
          x1="110.6"
          y1="37.9"
          x2="116.4"
          y2="29.8"
          stroke={light ? '#3E4A5C' : 'rgba(255,255,255,0.45)'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <div className="-mt-6 text-center">
        <div className="font-mono text-3xl" style={{ color }}>
          {value === null ? '—' : <Counter value={pct * 100} format={(v) => `${v.toFixed(0)}%`} />}
        </div>
        <div className={`font-mono text-[10px] uppercase tracking-[0.16em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
          Confidence
        </div>
      </div>
    </div>
  );
}
