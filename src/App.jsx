import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GridBackdrop from './components/GridBackdrop';
import Hero from './components/Hero';
import TabNav from './components/TabNav';
import SettingsMenu from './components/SettingsMenu';
import ThemeSwitch from './components/ThemeSwitch';
import { Toasts } from './components/ui';
import { useMode } from './lib/ModeContext';
import RaceTab from './tabs/race/RaceTab.jsx';
import GateTab from './tabs/gate/GateTab.jsx';
import ExamplesTab from './tabs/examples/ExamplesTab.jsx';
import PiiTab from './tabs/pii/PiiTab.jsx';

const THEME_KEY = 'jev-home-theme';

function readLightTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'light';
  } catch {
    return false;
  }
}

const TABS = [
  { id: 'race', label: 'Ticket Sorting Race', href: '/' },
  { id: 'gate', label: 'Agent Safety Gate', href: '/gate' },
  { id: 'examples', label: 'Examples', href: '/examples' },
  { id: 'pii', label: 'PII Detection', href: '/pii' },
];

const tabFromPath = (pathname) => {
  const path = pathname.replace(/\/+$/, '') || '/';
  return TABS.find((tab) => tab.href === path)?.id ?? null;
};

export default function App() {
  const [tab, setTabState] = useState(() => tabFromPath(window.location.pathname) ?? 'race');

  useEffect(() => {
    if (tabFromPath(window.location.pathname)) return;
    window.history.replaceState({ tab: 'race' }, '', '/');
  }, []);

  useEffect(() => {
    const onPop = () => setTabState(tabFromPath(window.location.pathname) ?? 'race');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setTab = (id) => {
    const next = TABS.find((item) => item.id === id) ?? TABS[0];
    if (window.location.pathname !== next.href) {
      window.history.pushState({ tab: next.id }, '', next.href);
    }
    setTabState(next.id);
  };
  const [light, setLight] = useState(readLightTheme);
  const { toasts, dismissToast } = useMode();

  useEffect(() => {
    document.body.style.backgroundColor = light ? '#F7F5F0' : '';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [light]);

  const setHomeTheme = (next) => {
    setLight(next);
    try {
      localStorage.setItem(THEME_KEY, next ? 'light' : 'dark');
    } catch {
      /* private mode */
    }
  };

  return (
    <div className={light ? 'min-h-full bg-[#F7F5F0] text-[#141B2E]' : 'min-h-full'}>
      {light ? null : <GridBackdrop />}

      <header
        className={
          light
            ? 'sticky top-0 z-30 border-b border-[#E4E0D6] bg-[#F7F5F0]'
            : 'sticky top-0 z-30 border-b border-white/5 bg-[var(--color-void)]/70 backdrop-blur-xl'
        }
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span
              className={
                light
                  ? 'grid h-8 w-8 place-items-center rounded-lg bg-[#00897B] font-bold text-white'
                  : 'grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--color-jev)] to-[var(--color-jev-deep)] font-bold text-[#04060f]'
              }
            >
              J
            </span>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Jev vs Chatbot AI
              <span className={light ? 'hidden text-[#3E4A5C] sm:inline' : 'hidden text-slate-400 sm:inline'}>
                : See the Difference
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitch light={light} onChange={setHomeTheme} />
            <SettingsMenu light={light} />
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl overflow-x-auto px-5 pb-3">
          <TabNav tabs={TABS} active={tab} onChange={setTab} light={light} />
        </div>
      </header>

      {tab === 'race' ? <Hero light={light} /> : null}

      <main className="pb-24">
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
            className={
              tab === 'examples' || tab === 'pii'
                ? 'mx-auto mt-6 w-full max-w-[88rem] px-4 sm:px-6'
                : 'mx-auto mt-12 w-full max-w-6xl px-5'
            }
          >
            {tab === 'race' ? (
              <RaceTab light={light} />
            ) : tab === 'gate' ? (
              <GateTab light={light} />
            ) : tab === 'examples' ? (
              <ExamplesTab light={light} />
            ) : (
              <PiiTab light={light} />
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

