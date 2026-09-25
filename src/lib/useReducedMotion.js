import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Tracks the OS "reduce motion" preference. Components use it to drop
 * decorative animation (particles, flying cards) while keeping the demo
 * fully usable.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (e) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
