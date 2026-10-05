import { useMemo, useState } from 'react';
import { GlassCard } from '../../components/ui.jsx';
import { PII_PRESETS, demoResultFor } from '../../data/piiMessages.js';
import { useMode } from '../../lib/ModeContext.jsx';

/**
 * PII Detection: the same question asked of an LLM and of Jev, replayed as
 * an animated scene after the LangChain video "PII Detection with Jev vs LLM".
 */
export default function PiiTab({ light = false }) {
  const { isLive } = useMode();
  const [presetId, setPresetId] = useState(PII_PRESETS[0].id);
  const [custom, setCustom] = useState('');

  const preset = PII_PRESETS.find((p) => p.id === presetId) ?? PII_PRESETS[0];
  const result = useMemo(() => demoResultFor(preset), [preset]);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">PII Detection</h2>
        <p className={`mx-auto mt-2 max-w-2xl text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-400'}`}>
          One question, asked two ways: does this message contain an email address, a phone
          number, or a credit card number? Watch an LLM write its answer, then watch Jev
          return three probabilities.
        </p>
      </div>

      <PresetPicker light={light} presetId={presetId} onPick={setPresetId} />

      <LiveTextBox light={light} enabled={isLive} value={custom} onChange={setCustom} />

      <GlassCard plain={light} className="p-6">
        <p className={`font-mono text-sm ${light ? 'text-[#141B2E]' : 'text-slate-200'}`}>{result.message}</p>
      </GlassCard>
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
