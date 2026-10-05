import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * The PII scene as data. Every step is { id, start, duration } in ms, measured
 * from the start of its scene. Playback is a single clock `t` across all three
 * scenes, so pause, replay, scene jumps and skip-to-end only move or freeze `t`.
 *
 * `llmMs` / `jevMs` are how long each timer runs: the video's 5.0s / 0.1s in
 * Demo mode, the measured latency in Live mode.
 */
export function buildTimeline({ llmMs, jevMs }) {
  const llmTimerStart = 1400;
  const proseShare = 0.6;
  const scene1 = [
    { id: 'instructions', start: 0, duration: 500 },
    { id: 'state', start: 500, duration: 400 },
    { id: 'arrow', start: 900, duration: 500 },
    { id: 'timer', start: llmTimerStart, duration: llmMs },
    { id: 'prose', start: llmTimerStart, duration: llmMs * proseShare },
    { id: 'json', start: llmTimerStart + llmMs * proseShare, duration: llmMs * (1 - proseShare) },
    { id: 'caption', start: llmTimerStart + llmMs, duration: 400 },
  ];

  const jevTimerStart = 1550;
  const scene2 = [
    { id: 'chip0', start: 0, duration: 350 },
    { id: 'chip1', start: 250, duration: 350 },
    { id: 'chip2', start: 500, duration: 350 },
    { id: 'state', start: 850, duration: 300 },
    { id: 'arrow', start: 1150, duration: 400 },
    { id: 'timer', start: jevTimerStart, duration: jevMs },
    // All three bars share one step: they fill together because Jev answers
    // the three questions in parallel.
    { id: 'bars', start: jevTimerStart + jevMs, duration: 700 },
    { id: 'caption', start: jevTimerStart + jevMs + 700, duration: 400 },
  ];

  const scene3 = [
    { id: 'llm', start: 0, duration: 450 },
    { id: 'jev', start: 200, duration: 450 },
    { id: 'rows', start: 500, duration: 500 },
  ];

  const HOLD = 1600; // linger on a finished scene before moving on
  const scenes = [
    { id: 's1', steps: scene1, hold: HOLD },
    { id: 's2', steps: scene2, hold: HOLD },
    { id: 's3', steps: scene3, hold: 0 },
  ];

  let offset = 0;
  return scenes.map((scene) => {
    const end = Math.max(...scene.steps.map((s) => s.start + s.duration));
    const length = end + scene.hold;
    const built = { ...scene, offset, length };
    offset += length;
    return built;
  });
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function usePiiPlayback({ llmMs, jevMs, reduced }) {
  const scenes = useMemo(() => buildTimeline({ llmMs, jevMs }), [llmMs, jevMs]);
  const total = scenes[scenes.length - 1].offset + scenes[scenes.length - 1].length;

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);

  const seek = useCallback(
    (ms) => {
      const next = Math.min(Math.max(ms, 0), total);
      tRef.current = next;
      setT(next);
    },
    [total]
  );

  useEffect(() => {
    if (!playing) return undefined;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const next = Math.min(tRef.current + (now - last), total);
      last = now;
      tRef.current = next;
      setT(next);
      if (next >= total) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, total]);

  // A new timeline (new preset or live result) starts from the first frame.
  useEffect(() => {
    tRef.current = 0;
    setT(0);
  }, [scenes]);

  const done = t >= total;
  const sceneIndex = Math.max(
    0,
    scenes.findIndex((s, i) => t < s.offset + s.length || i === scenes.length - 1)
  );

  /** 0..1 progress of a step. Reduced motion turns every step into a cut. */
  const progress = useCallback(
    (index, stepId) => {
      const scene = scenes[index];
      const step = scene?.steps.find((s) => s.id === stepId);
      if (!step) return 0;
      const local = t - scene.offset - step.start;
      if (reduced) return local >= 0 ? 1 : 0;
      return step.duration <= 0 ? (local >= 0 ? 1 : 0) : clamp01(local / step.duration);
    },
    [scenes, t, reduced]
  );

  const play = useCallback(() => {
    if (tRef.current >= total) seek(0);
    setPlaying(true);
  }, [seek, total]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);
  const replay = useCallback(() => {
    seek(0);
    setPlaying(true);
  }, [seek]);
  // Jumping to a scene plays it: its first frame is empty by design.
  const goToScene = useCallback(
    (index) => {
      seek(scenes[index].offset);
      setPlaying(true);
    },
    [scenes, seek]
  );
  const reset = useCallback(() => {
    setPlaying(false);
    seek(0);
  }, [seek]);
  const skipToEnd = useCallback(() => {
    setPlaying(false);
    seek(total);
  }, [seek, total]);

  return {
    t,
    total,
    playing,
    done,
    started: t > 0,
    sceneIndex,
    scenes,
    progress,
    play,
    pause,
    toggle,
    replay,
    goToScene,
    skipToEnd,
    reset,
  };
}
