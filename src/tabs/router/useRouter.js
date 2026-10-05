import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROUTER_REQUESTS } from '../../data/routerRequests.js';
import { ROUTER_FALLBACK_THRESHOLD } from '../../lib/constants.js';
import { createRouterEngine, scoreRun } from '../../lib/routerEngines.js';

const emptyRun = () => ({ results: [], current: null, startedAt: null, finishedAt: null, error: null });

/**
 * Streams the 24 requests through the router one at a time, like useRace:
 * a run token drops updates from a run that was reset or restarted, one rAF
 * clock drives the wall-clock timer, and the speed ref applies mid-run.
 *
 * The threshold is shared: the engine reads it when it routes, and every
 * number on screen is re-scored from stored confidences via scoreRun().
 */
export function useRouter({ live, answer = false, onLiveFailure }) {
  const [status, setStatus] = useState('idle'); // idle | running | paused | done
  const [speed, setSpeed] = useState(1);
  const [threshold, setThreshold] = useState(ROUTER_FALLBACK_THRESHOLD);
  const [run, setRun] = useState(emptyRun);
  const [now, setNow] = useState(0);
  const [paused, setPaused] = useState(false);

  const speedRef = useRef(speed);
  speedRef.current = speed;
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  const answerRef = useRef(answer);
  answerRef.current = answer;
  const runToken = useRef(0);
  const pausedRef = useRef(false);
  const pauseWaiters = useRef([]);

  const releasePause = () => {
    const pending = pauseWaiters.current.splice(0);
    pending.forEach((resolve) => resolve());
  };

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
    pausedRef.current = false;
    setPaused(false);
    releasePause();
    setRun(emptyRun());
    setStatus('idle');
  }, []);

  const pause = useCallback(() => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    setPaused(true);
    setStatus((current) => (current === 'running' ? 'paused' : current));
  }, []);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    setStatus((current) => (current === 'paused' ? 'running' : current));
    releasePause();
  }, []);

  const start = useCallback(() => {
    runToken.current += 1;
    pausedRef.current = false;
    setPaused(false);
    releasePause();
    const token = runToken.current;
    const engine = createRouterEngine({
      live,
      seed: Math.floor(Math.random() * 1e9),
      speed: () => speedRef.current,
      threshold: () => thresholdRef.current,
      answer: () => answerRef.current,
    });

    const startedAt = performance.now();
    setRun({ ...emptyRun(), startedAt });
    setStatus('running');
    setNow(startedAt);

    (async () => {
      for (const request of ROUTER_REQUESTS) {
        if (runToken.current !== token) return;
        if (pausedRef.current) {
          await new Promise((resolve) => {
            const finish = () => {
              if (runToken.current !== token || !pausedRef.current) resolve();
              else pauseWaiters.current.push(finish);
            };
            finish();
          });
          if (runToken.current !== token) return;
        }
        setRun((prev) => ({ ...prev, current: request }));
        let result;
        try {
          result = await engine.route(request);
        } catch (err) {
          if (runToken.current !== token) return;
          setRun((prev) => ({ ...prev, current: null, error: err.message }));
          setStatus('idle');
          onLiveFailure?.(err);
          return;
        }
        if (runToken.current !== token) return;
        setRun((prev) => ({ ...prev, current: null, results: [...prev.results, result] }));
      }
      if (runToken.current !== token) return;
      setRun((prev) => ({ ...prev, finishedAt: performance.now() }));
      setStatus('done');
    })();
  }, [live, onLiveFailure]);

  const score = useMemo(() => scoreRun(run.results, threshold), [run.results, threshold]);

  const wallMs = run.startedAt
    ? (run.finishedAt ?? Math.max(now, run.startedAt)) - run.startedAt
    : 0;

  return {
    status,
    speed,
    setSpeed,
    threshold,
    setThreshold,
    current: run.current,
    error: run.error,
    results: run.results,
    score,
    wallMs,
    total: ROUTER_REQUESTS.length,
    paused,
    start,
    pause,
    resume,
    reset,
  };
}
