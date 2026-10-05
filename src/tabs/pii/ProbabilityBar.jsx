/**
 * Full-width probability bar in the video's style: an olive fill on a pale
 * lime track. `fill` is 0..1 of the way to `value`, so all three bars can be
 * driven by one shared animation step. `threshold` draws a marker.
 */
export default function ProbabilityBar({ value, fill = 1, threshold = null, light, flagged = false }) {
  const width = Math.max(0, Math.min(1, value * fill)) * 100;
  return (
    <div
      className={`relative h-2.5 w-full overflow-hidden rounded-full ${
        light ? 'bg-[var(--color-pii-jev-pale)] ring-1 ring-[var(--color-pii-jev-olive)]/25' : 'bg-white/8'
      }`}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          background: light
            ? 'var(--color-pii-jev-olive)'
            : 'linear-gradient(90deg, var(--color-pii-jev-olive), var(--color-pii-jev))',
          boxShadow: !light && flagged ? '0 0 14px -2px var(--color-pii-jev)' : 'none',
        }}
      />
      {threshold !== null ? (
        <span
          className={`absolute top-[-2px] h-[calc(100%+4px)] w-0.5 ${light ? 'bg-[#141B2E]/60' : 'bg-white/70'}`}
          style={{ left: `calc(${threshold * 100}% - 1px)` }}
        />
      ) : null}
    </div>
  );
}
