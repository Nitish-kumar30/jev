/** Shared class/colour helpers so every router component themes the same way. */
export function routerTheme(light) {
  return {
    light,
    text: light ? 'text-[#141B2E]' : 'text-slate-100',
    body: light ? 'text-[#243044]' : 'text-slate-300',
    muted: light ? 'text-[#3E4A5C]' : 'text-slate-400',
    faint: light ? 'text-[#5C6778]' : 'text-slate-500',
    card: light ? 'border border-[#E4E0D6] bg-[#FDFCFA]' : 'glass',
    inset: light ? 'border border-[#E4E0D6] bg-[#F7F5F0]' : 'border border-white/8 bg-black/25',
    label: `font-mono text-[10px] uppercase tracking-[0.16em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`,
    tier: {
      fast: light ? 'var(--color-fast-ink)' : 'var(--color-fast)',
      powerful: light ? 'var(--color-powerful-ink)' : 'var(--color-powerful)',
    },
    chart: {
      fast: 'var(--color-chart-fast)',
      powerful: light ? 'var(--color-chart-powerful-light)' : 'var(--color-chart-powerful)',
    },
  };
}

export const TIER_LABEL = { fast: 'Fast model', powerful: 'Powerful model' };
