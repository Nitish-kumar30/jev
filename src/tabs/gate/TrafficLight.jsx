import { motion } from 'framer-motion';
import { DECISIONS } from '../../lib/gateEngine.js';
import { usePrefersReducedMotion } from '../../lib/useReducedMotion.js';

const ORDER = ['block', 'ask', 'allow'];

/** Large vertical traffic light. The active lamp glows and pulses silently. */
export default function TrafficLight({ decision }) {
  const reduced = usePrefersReducedMotion();

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-black/40 px-5 py-6"
      role="img"
      aria-label={decision ? `Gate decision: ${DECISIONS[decision].label}` : 'Gate idle'}
    >
      {ORDER.map((key) => {
        const active = decision === key;
        const { color } = DECISIONS[key];
        return (
          <motion.span
            key={key}
            animate={
              active && !reduced
                ? { boxShadow: [`0 0 18px -2px ${color}`, `0 0 46px 2px ${color}`, `0 0 18px -2px ${color}`] }
                : { boxShadow: 'none' }
            }
            transition={{ duration: 1.8, repeat: active && !reduced ? Infinity : 0, ease: 'easeInOut' }}
            className="h-14 w-14 rounded-full border sm:h-16 sm:w-16"
            style={{
              background: active ? color : `${color}26`,
              borderColor: active ? color : `${color}66`,
              opacity: active ? 1 : 0.5,
            }}
          />
        );
      })}
      <span
        className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: decision ? DECISIONS[decision].color : 'rgb(148 163 184)' }}
      >
        {decision ? DECISIONS[decision].label : 'Waiting'}
      </span>
    </div>
  );
}
