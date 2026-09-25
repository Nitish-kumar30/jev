import { motion } from 'framer-motion';

/** Two-tab switcher with arrow-key support, wired as a real ARIA tablist. */
export default function TabNav({ tabs, active, onChange }) {
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === active);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
      onChange(tabs[next].id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Demonstrations"
      onKeyDown={onKeyDown}
      className="glass inline-flex rounded-full p-1"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className="relative rounded-full px-4 py-2 text-xs font-semibold transition sm:px-5 sm:text-sm"
          >
            {selected ? (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full bg-[var(--color-jev)]/15 ring-1 ring-[var(--color-jev)]/50"
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              />
            ) : null}
            <span className={`relative ${selected ? 'text-[var(--color-jev)]' : 'text-slate-300'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
