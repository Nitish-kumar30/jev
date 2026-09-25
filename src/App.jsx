import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GridBackdrop from './components/GridBackdrop';
import Hero from './components/Hero';
import TabNav from './components/TabNav';
import SettingsMenu from './components/SettingsMenu';
import { Toasts } from './components/ui';
import { useMode } from './lib/ModeContext';
import RaceTab from './tabs/race/RaceTab.jsx';
import GateTab from './tabs/gate/GateTab.jsx';

const TABS = [
  { id: 'race', label: 'Ticket Sorting Race' },
  { id: 'gate', label: 'Agent Safety Gate' },
];

export default function App() {
  const [tab, setTab] = useState('race');
  const { toasts, dismissToast } = useMode();

  return (
    <div className="min-h-full">
      <GridBackdrop />

      <header className="sticky top-0 z-30 border-b border-white/5 bg-[var(--color-void)]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--color-jev)] to-[var(--color-jev-deep)] font-bold text-[#04060f]">
              J
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Jev vs Chatbot AI
              <span className="hidden text-slate-400 sm:inline">: See the Difference</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <TabNav tabs={TABS} active={tab} onChange={setTab} />
            </div>
            <SettingsMenu />
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-5 pb-3 sm:hidden">
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
        </div>
      </header>

      <main className="pb-24">
        <Hero />
        <AnimatePresence mode="wait">
          <motion.section
            key={tab}
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            tabIndex={-1}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mx-auto mt-12 w-full max-w-6xl px-5"
          >
            {tab === 'race' ? <RaceTab /> : <GateTab />}
          </motion.section>
        </AnimatePresence>
      </main>

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

