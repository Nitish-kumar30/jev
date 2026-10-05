import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ScenePanel, { FieldLabel, Reveal } from './ScenePanel.jsx';
import LlmResult from './LlmResult.jsx';
import JevResult from './JevResult.jsx';
import SideBySide from './SideBySide.jsx';
import { usePiiPlayback } from './usePiiPlayback.js';
import { formatSeconds } from './format.js';
import { PII_FIELDS, PII_INSTRUCTIONS, PII_PRESETS, demoResultFor } from '../../data/piiMessages.js';
import { useMode } from '../../lib/ModeContext.jsx';
import { usePrefersReducedMotion } from '../../lib/useReducedMotion.js';

const SCENE_NAMES = ['How an LLM answers', 'How Jev answers', 'Side by side'];
const INTERACTIVE = 'button, input, textarea, select, a, [role="switch"], [role="tab"]';

/**
 * PII Detection: the same question asked of an LLM and of Jev, replayed as
 * an animated scene after the LangChain video "PII Detection with Jev vs LLM".
 */
export default function PiiTab({ light = false }) {
  const { isDemo, isLive } = useMode();
  const reduced = usePrefersReducedMotion();
  const [presetId, setPresetId] = useState(PII_PRESETS[0].id);
  const [custom, setCustom] = useState('');
  const [threshold, setThreshold] = useState(0.5);
  const rootRef = useRef(null);

  const preset = PII_PRESETS.find((p) => p.id === presetId) ?? PII_PRESETS[0];
  const result = useMemo(() => demoResultFor(preset), [preset]);
  const simulated = result.simulated;

  const playback = usePiiPlayback({ llmMs: result.llm.ms, jevMs: result.jev.ms, reduced });
  const { progress, sceneIndex, playing, started, done, toggle, replay, goToScene, skipToEnd, play, reset } = playback;

  const pickPreset = (id) => {
    setPresetId(id);
    reset();
  };

  // Space toggles play/pause while focus is on the tab panel or the stage,
  // but never steals Space from a button, input or link.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const el = document.activeElement;
      const panel = document.getElementById('panel-pii');
      const inside = el === panel || (rootRef.current && rootRef.current.contains(el));
      if (!inside || (el && el !== panel && el.matches(INTERACTIVE))) return;
      e.preventDefault();
      toggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toggle]);

  const s1 = (id) => progress(0, id);
  const s2 = (id) => progress(1, id);
  const s3 = (id) => progress(2, id);

  const llmTimer = formatSeconds(s1('timer') * result.llm.ms, result.llm.ms);
  const jevTimer = formatSeconds(s2('timer') * result.jev.ms, result.jev.ms);

  const announcement = [
    s1('caption') >= 1
      ? `LLM answered in ${formatSeconds(result.llm.ms)}. ${result.llm.text} ${
          result.llm.parseFailed
            ? 'Structured output: parse failed.'
            : `Structured output: ${PII_FIELDS.map(({ key }) => `${key} ${result.llm.structured?.[key]}`).join(', ')}.`
        }`
      : '',
    s2('caption') >= 1
      ? `Jev answered in ${formatSeconds(result.jev.ms)}: ${PII_FIELDS.map(
          ({ key }) => `${key} ${result.jev.answers[key]?.toFixed?.(2) ?? 'n/a'}`
        ).join(', ')}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const stateBlock = (p) => (
    <Reveal progress={p}>
      <FieldLabel light={light}>state</FieldLabel>
      <p className={`mt-1.5 break-words font-mono text-[13px] leading-relaxed ${light ? 'text-[#0F1724]' : 'text-slate-200'}`}>
        {result.message}
      </p>
    </Reveal>
  );

  const scenes = [
    <ScenePanel
      key="s1"
      accent="llm"
      number="01"
      title={SCENE_NAMES[0]}
      timer={llmTimer}
      caption={`${formatSeconds(result.llm.ms)} for text and structured output`}
      captionProgress={s1('caption')}
      arrowProgress={s1('arrow')}
      rightHeader="LLM"
      simulated={simulated}
      light={light}
      left={
        <>
          <Reveal progress={s1('instructions')}>
            <FieldLabel light={light}>instructions</FieldLabel>
            <p
              className={`mt-1.5 rounded-lg px-3 py-2 font-mono text-[13px] leading-relaxed ${
                light
                  ? 'bg-[#dbeefe] text-[#0F1724]'
                  : 'border border-[var(--color-pii-llm)]/40 bg-[var(--color-pii-llm)]/12 text-sky-100'
              }`}
            >
              {PII_INSTRUCTIONS}
            </p>
          </Reveal>
          {stateBlock(s1('state'))}
        </>
      }
      right={<LlmResult llm={result.llm} proseProgress={s1('prose')} jsonProgress={s1('json')} light={light} />}
    />,
    <ScenePanel
      key="s2"
      accent="jev"
      number="02"
      title={SCENE_NAMES[1]}
      timer={jevTimer}
      caption={`${formatSeconds(result.jev.ms)} for three probabilities`}
      captionProgress={s2('caption')}
      arrowProgress={s2('arrow')}
      rightHeader="jev // noul"
      simulated={simulated}
      light={light}
      left={
        <>
          <div>
            <FieldLabel light={light}>questions</FieldLabel>
            <div className="mt-1.5 flex flex-col items-start gap-1.5">
              {PII_FIELDS.map(({ key, question }, i) => {
                const p = s2(`chip${i}`);
                return (
                  <span
                    key={key}
                    className={`rounded-lg px-3 py-1.5 font-mono text-[13px] ${
                      light
                        ? 'bg-[var(--color-pii-jev)] text-[var(--color-pii-jev-ink)]'
                        : 'border border-[var(--color-pii-jev)]/40 bg-[var(--color-pii-jev)]/15 text-[var(--color-pii-jev)]'
                    }`}
                    style={{ opacity: p, transform: `scale(${0.85 + 0.15 * popEase(p)})`, transformOrigin: 'left center' }}
                  >
                    {question}
                  </span>
                );
              })}
            </div>
          </div>
          {stateBlock(s2('state'))}
        </>
      }
      right={<JevResult answers={result.jev.answers} fill={easeOut(s2('bars'))} light={light} />}
    />,
    <SideBySide
      key="s3"
      result={result}
      threshold={threshold}
      onThreshold={setThreshold}
      progress={{ llm: s3('llm'), jev: s3('jev'), rows: s3('rows') }}
      simulated={simulated}
      light={light}
    />,
  ];

  return (
    <div className="space-y-5" ref={rootRef}>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">PII Detection</h2>
        <p className={`mx-auto mt-2 max-w-2xl text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-400'}`}>
          One question, asked two ways: does this message contain an email address, a phone
          number, or a credit card number? Watch an LLM write its answer, then watch Jev
          return three probabilities.
        </p>
      </div>

      <PresetPicker light={light} presetId={presetId} onPick={pickPreset} />

      <LiveTextBox light={light} enabled={isLive} value={custom} onChange={setCustom} />

      <Controls
        light={light}
        playing={playing}
        started={started}
        done={done}
        sceneIndex={sceneIndex}
        onToggle={toggle}
        onReplay={replay}
        onScene={goToScene}
        onSkip={skipToEnd}
      />

      <div
        tabIndex={0}
        aria-label={`PII scene ${sceneIndex + 1} of 3: ${SCENE_NAMES[sceneIndex]}. Press Space to play or pause.`}
        className="relative rounded-3xl"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={sceneIndex}
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -6 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
          >
            {scenes[sceneIndex]}
          </motion.div>
        </AnimatePresence>

        {!started && !playing ? (
          <div className="absolute inset-0 grid place-items-center rounded-3xl">
            <button
              type="button"
              onClick={play}
              aria-label="Play the PII detection scene"
              className={`flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] shadow-xl ${
                light
                  ? 'bg-[var(--color-pii-llm-ink)] text-white'
                  : 'bg-[var(--color-pii-llm)] text-[#04060f] shadow-[0_0_40px_-8px_var(--color-pii-llm)]'
              }`}
            >
              <span aria-hidden="true">▶</span> Play
            </button>
          </div>
        ) : null}
      </div>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <p className={`text-center text-[11px] ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>
        {isDemo
          ? 'Demo mode: scripted answers, with the 5.0s and 0.1s timings shown in the LangChain video. Not a measurement.'
          : 'Live mode: both models answer for real; the timers stop at the measured latency.'}
      </p>
    </div>
  );
}

const easeOut = (p) => 1 - (1 - p) ** 3;
/** Slight overshoot so the chips pop rather than slide. */
const popEase = (p) => {
  const c = 1.70158;
  return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2;
};

function Controls({ light, playing, started, done, sceneIndex, onToggle, onReplay, onScene, onSkip }) {
  const btn = light
    ? 'border-[#E4E0D6] bg-[#FDFCFA] text-[#141B2E] hover:border-[#9AA3B2]'
    : 'border-white/12 bg-white/[0.03] text-slate-200 hover:border-white/30';
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 rounded-2xl p-3 ${
        light ? 'border border-[#E4E0D6] bg-[#FDFCFA]' : 'glass'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? 'Pause' : done ? 'Play again from the start' : 'Play'}
        className={`min-w-[6.5rem] rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
          light
            ? 'bg-[var(--color-pii-llm-ink)] text-white'
            : 'bg-[var(--color-pii-llm)]/20 text-[var(--color-pii-llm)] ring-1 ring-[var(--color-pii-llm)]/50'
        }`}
      >
        {playing ? '❚❚ Pause' : '▶ Play'}
      </button>
      <button
        type="button"
        onClick={onReplay}
        disabled={!started}
        aria-label="Replay from the start"
        className={`rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] disabled:opacity-40 ${btn}`}
      >
        ↺ Replay
      </button>

      <div role="group" aria-label="Scenes" className="flex items-center gap-1 px-2">
        {SCENE_NAMES.map((name, i) => {
          const active = i === sceneIndex;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onScene(i)}
              aria-label={`Go to scene ${i + 1}: ${name}`}
              aria-current={active ? 'step' : undefined}
              title={name}
              className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs tabular-nums transition ${
                active
                  ? light
                    ? 'border-[#141B2E] bg-[#141B2E] text-white'
                    : 'border-white/60 bg-white/15 text-white'
                  : btn
              }`}
            >
              0{i + 1}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={done}
        aria-label="Skip to the end"
        className={`rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] disabled:opacity-40 ${btn}`}
      >
        Skip to end ⏭
      </button>
    </div>
  );
}

export function PresetPicker({ light, presetId, onPick, disabled = false }) {
  return (
    <fieldset className="flex flex-wrap items-center justify-center gap-2" disabled={disabled}>
      <legend className="sr-only">Message preset</legend>
      {PII_PRESETS.map((p, i) => {
        const active = p.id === presetId;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(p.id)}
            title={p.message}
            className={`rounded-xl border px-3 py-2 text-left text-xs transition disabled:opacity-50 ${
              light
                ? active
                  ? 'border-[var(--color-pii-llm-ink)] bg-[var(--color-pii-llm-pale)] text-[#0F1724]'
                  : 'border-[#E4E0D6] bg-[#FDFCFA] text-[#243044] hover:border-[#9AA3B2]'
                : active
                  ? 'border-[var(--color-pii-llm)]/70 bg-[var(--color-pii-llm)]/12 text-white'
                  : 'border-white/12 bg-white/[0.03] text-slate-300 hover:border-white/30'
            }`}
          >
            <span className="font-mono text-[10px] opacity-70">0{i + 1}</span>{' '}
            <span className="font-semibold">{p.label}</span>
            <span className={`block text-[10px] ${light ? 'text-[#5C6778]' : 'text-slate-500'}`}>{p.hint}</span>
          </button>
        );
      })}
    </fieldset>
  );
}

export function LiveTextBox({ light, enabled, value, onChange, onSubmit, busy = false }) {
  return (
    <form
      className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (enabled && value.trim()) onSubmit?.(value.trim());
      }}
    >
      <label htmlFor="pii-custom" className="sr-only">
        Your own message (Live mode only)
      </label>
      <input
        id="pii-custom"
        value={value}
        maxLength={2000}
        disabled={!enabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={enabled ? 'Type your own message to check for PII' : 'Your own message — switch to Live mode to use this'}
        className={`min-w-0 flex-1 rounded-lg border px-3 py-2 font-mono text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
          light
            ? 'border-[#C9C3B6] bg-white text-[#0F1724] placeholder:text-[#5C6778]'
            : 'border-white/12 bg-black/30 text-slate-100 placeholder:text-slate-500'
        }`}
      />
      <button
        type="submit"
        disabled={!enabled || !value.trim() || busy}
        className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] disabled:opacity-40 ${
          light
            ? 'bg-[var(--color-pii-llm-ink)] text-white'
            : 'bg-[var(--color-pii-llm)]/20 text-[var(--color-pii-llm)] ring-1 ring-[var(--color-pii-llm)]/50'
        }`}
      >
        {busy ? 'Asking…' : 'Check live'}
      </button>
    </form>
  );
}
