import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ModeContext = createContext(null);

export const MODES = { DEMO: 'demo', LIVE: 'live' };

/**
 * Holds the demo/live switch plus a tiny toast queue. Live mode is only a
 * request to use the backend: if the backend reports missing API keys the
 * engines call `fallbackToDemo()` and we drop back to simulation.
 */
export function ModeProvider({ children }) {
  const [mode, setMode] = useState(MODES.DEMO);
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, tone: 'info', ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fallbackToDemo = useCallback(
    (reason) => {
      setMode(MODES.DEMO);
      pushToast({
        tone: 'warn',
        title: 'Switched back to Demo mode',
        body: reason || 'The backend is unavailable or API keys are missing.',
      });
    },
    [pushToast]
  );

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isDemo: mode === MODES.DEMO,
      isLive: mode === MODES.LIVE,
      toasts,
      pushToast,
      dismissToast,
      fallbackToDemo,
    }),
    [mode, toasts, pushToast, dismissToast, fallbackToDemo]
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside <ModeProvider>');
  return ctx;
}
