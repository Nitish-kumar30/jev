import { PII_FIELDS } from '../../data/piiMessages.js';

/**
 * The LLM's answer: prose that streams in word by word, a divider, then a
 * JSON block that types in character by character. Both are driven by 0..1
 * progress values from the timeline, never by their own timers.
 */
export default function LlmResult({ llm, proseProgress, jsonProgress, light, compact = false }) {
  const words = llm.text.split(/(\s+)/);
  const shownWords = words.slice(0, Math.ceil(proseProgress * words.length)).join('');

  const json = llm.parseFailed
    ? null
    : `{\n${PII_FIELDS.map(({ key }) => `  "${key}": ${JSON.stringify(llm.structured?.[key] ?? null)}`).join(',\n')}\n}`;
  const shownJson = json ? json.slice(0, Math.ceil(jsonProgress * json.length)) : '';

  const label = `font-mono text-[10px] uppercase tracking-[0.18em] ${light ? 'text-[var(--color-pii-llm-ink)]' : 'text-[var(--color-pii-llm)]/80'}`;

  return (
    <div className="flex h-full flex-col">
      <div className={label}>text</div>
      <p
        className={`mt-2 font-mono leading-relaxed ${compact ? 'min-h-[3rem] text-[11px]' : 'min-h-[6.5rem] text-[13px]'} ${
          light ? 'text-[#0F1724]' : 'text-slate-100'
        }`}
      >
        {shownWords}
        {proseProgress > 0 && proseProgress < 1 ? <Caret light={light} /> : null}
      </p>

      <hr className={`my-3 ${light ? 'border-[var(--color-pii-llm-ink)]/20' : 'border-[var(--color-pii-llm)]/25'}`} />

      <div className={label}>structured output</div>
      {llm.parseFailed ? (
        jsonProgress > 0 ? (
          <div className="mt-2 rounded-lg border border-[var(--color-spam)]/60 bg-[var(--color-spam)]/10 p-2 font-mono text-xs text-[var(--color-spam)]">
            parse failed — the reply had no JSON object we could read
          </div>
        ) : null
      ) : (
        <pre
          className={`mt-2 whitespace-pre-wrap rounded-lg p-2.5 font-mono leading-relaxed ${compact ? 'min-h-[4.5rem] text-[11px]' : 'min-h-[6.5rem] text-[12px]'} ${
            light ? 'bg-white/80 text-[#0F1724] ring-1 ring-[var(--color-pii-llm-ink)]/15' : 'bg-black/35 text-slate-200'
          }`}
        >
          {colorJson(shownJson, light)}
          {jsonProgress > 0 && jsonProgress < 1 ? <Caret light={light} /> : null}
        </pre>
      )}
    </div>
  );
}

function Caret({ light }) {
  return (
    <span
      aria-hidden="true"
      className={`ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[2px] ${light ? 'bg-[var(--color-pii-llm-ink)]' : 'bg-[var(--color-pii-llm)]'}`}
    />
  );
}

/** Colours true/false so they read at a glance, even mid-typing. */
function colorJson(text, light) {
  return text.split(/(true|false)/).map((part, i) =>
    part === 'true' || part === 'false' ? (
      <span
        key={i}
        className={
          part === 'true'
            ? light ? 'font-semibold text-[#0369a1]' : 'font-semibold text-[var(--color-pii-llm)]'
            : light ? 'text-[#5C6778]' : 'text-slate-400'
        }
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}
