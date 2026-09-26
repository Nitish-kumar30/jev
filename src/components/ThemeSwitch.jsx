/** Navbar switch for the home-page look. Dark stays the default. */
export default function ThemeSwitch({ light, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={light}
      onClick={() => onChange(!light)}
      className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-semibold ${
        light
          ? 'border-[#E4E0D6] bg-[#FDFCFA] text-[#243044]'
          : 'border-white/15 bg-white/5 text-slate-300'
      }`}
    >
      <span className={light ? 'text-[#5C6778]' : 'text-white'}>Dark</span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full ${light ? 'bg-[#00897B]' : 'bg-white/20'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] duration-200 ${
            light ? 'left-5' : 'left-0.5'
          }`}
        />
      </span>
      <span className={light ? 'text-[#141B2E]' : 'text-slate-400'}>Light</span>
      <span className="sr-only">{light ? 'Light theme on' : 'Dark theme on'}</span>
    </button>
  );
}
