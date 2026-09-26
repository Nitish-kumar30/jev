import { useState } from 'react';
import { highlightPython } from './highlight.js';

const KIND = {
  dark: {
    plain: 'text-slate-200',
    keyword: 'text-[var(--color-jev)]',
    string: 'text-[var(--color-bot)]',
    comment: 'text-slate-500',
  },
  light: {
    plain: 'text-[#0F1724]',
    keyword: 'text-[#0F766E]',
    string: 'text-[#9A3412]',
    comment: 'text-[#3F4A5A]',
  },
};

export default function CodePanel({ code, light = false }) {
  const [copied, setCopied] = useState(false);
  const lines = highlightPython(code);
  const tone = light ? KIND.light : KIND.dark;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        light ? 'border-[#C9C3B6] bg-white' : 'border-white/10 bg-black/40'
      }`}
    >
      <div
        className={`flex items-center justify-between gap-3 border-b px-3 py-2 ${
          light ? 'border-[#C9C3B6] bg-[#F7F5F0]' : 'border-white/8 bg-white/[0.03]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00897B]">Python</span>
          <span className={`font-mono text-[10px] ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>
            the example, not the server
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
            light
              ? 'border-[#C9C3B6] text-[#0F1724] hover:border-[#0F766E]'
              : 'border-white/12 text-slate-300 hover:border-[var(--color-jev)]/50 hover:text-white'
          }`}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto px-2 py-3">
        <pre className={`font-mono leading-relaxed ${light ? 'text-[13px]' : 'text-[12px]'}`}>
          {lines.map((tokens, index) => (
            <div key={index} className="flex min-h-[1.45em]">
              <span
                className={`w-8 shrink-0 select-none pr-3 text-right ${
                  light ? 'text-[#5C564C]' : 'text-slate-600'
                }`}
              >
                {index + 1}
              </span>
              <code className="whitespace-pre">
                {tokens.length
                  ? tokens.map((token, tokenIndex) => (
                      <span key={tokenIndex} className={tone[token.kind] || tone.plain}>
                        {token.text}
                      </span>
                    ))
                  : ' '}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
