import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TICKETS } from '../../data/tickets.js';
import { createEngines } from '../../lib/engines.js';
import { HUMAN_REVIEW } from '../../data/tickets.js';

const emptySide = () => ({
  results: [],
  startedAt: null,
  finishedAt: null,
  current: null, // ticket being processed right now
  error: null,
});

/**
 * Drives both engines over the same 50 messages, one message at a time per
 * side, and keeps the live counters in sync. The two sides run concurrently
 * with each other but sequentially within themselves, which is what makes the
 * speed difference visible.
 */
export function useRace({ live, onLiveFailure }) {
  const [status, setStatus] = useState('idle'); // idle | running | done
  const [speed, setSpeed] = useState(1);
  const [sides, setSides] = useState({ llm: emptySide(), jev: emptySide() });
  const [now, setNow] = useState(0);

  const speedRef = useRef(speed);
  speedRef.current = speed;
  const runToken = useRef(0);

  // One clock for both sides; each side freezes at its own finishedAt.
  useEffect(() => {
    if (status !== 'running') return undefined;
    let frame;
    const tick = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status]);

  const reset = useCallback(() => {
    runToken.current += 1;
    setSides({ llm: emptySide(), jev: emptySide() });
    setStatus('idle');
  }, []);

  const start = useCallback(() => {
    runToken.current += 1;
    const token = runToken.current;
    const seed = Math.floor(Math.random() * 1e9);
    const engines = createEngines({ live, seed, speed: () => speedRef.current });

    setSides({ llm: emptySide(), jev: emptySide() });
    setStatus('running');
    setNow(performance.now());

    const runSide = async (key) => {
      const engine = engines[key];
      const startedAt = performance.now();
      setSides((prev) => ({ ...prev, [key]: { ...emptySide(), startedAt } }));

      for (const ticket of TICKETS) {
        if (runToken.current !== token) return;
        setSides((prev) => ({ ...prev, [key]: { ...prev[key], current: ticket } }));
        let result;
        try {
          result = await engine.classify(ticket);
        } catch (err) {
          if (runToken.current !== token) return;
          setSides((prev) => ({ ...prev, [key]: { ...prev[key], error: err.message } }));
          onLiveFailure?.(err);
          return;
        }
        if (runToken.current !== token) return;
        setSides((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            current: null,
            results: [...prev[key].results, { ticket, ...result, at: performance.now() }],
          },
        }));
      }

      if (runToken.current !== token) return;
      const finishedAt = performance.now();
      setSides((prev) => ({ ...prev, [key]: { ...prev[key], finishedAt } }));
    };

    Promise.all([runSide('llm'), runSide('jev')]).then(() => {
      if (runToken.current === token) setStatus('done');
    });
  }, [live, onLiveFailure]);

  const stats = useMemo(() => {
    const build = (side) => {
      const decided = side.results.filter((r) => r.label !== HUMAN_REVIEW);
      const correct = decided.filter((r) => r.label === r.ticket.label).length;
      const wallMs = side.startedAt
        ? (side.finishedAt ?? Math.max(now, side.startedAt)) - side.startedAt
        : 0;
      // Time actually spent inside the engine, so the comparison is not
      // polluted by this page's own rendering work.
      const engineMs = side.results.reduce((sum, r) => sum + r.latencyMs, 0);
      return {
        done: side.results.length,
        total: TICKETS.length,
        elapsed: engineMs,
        wallMs,
        cost: side.results.reduce((sum, r) => sum + r.cost, 0),
        correct,
        decided: decided.length,
        accuracy: decided.length ? correct / decided.length : null,
        flagged: side.results.filter((r) => r.flagged).length,
        finished: Boolean(side.finishedAt),
      };
    };
    return { llm: build(sides.llm), jev: build(sides.jev) };
  }, [sides, now]);

  const speedup =
    stats.jev.finished && stats.llm.finished && stats.jev.elapsed > 0
      ? stats.llm.elapsed / stats.jev.elapsed
      : null;


  return { status, speed, setSpeed, sides, stats, speedup, start, reset };
}
