import { GlassCard } from '../../components/ui.jsx';
import { DECISIONS } from '../../lib/gateEngine.js';

/** Running record of everything the gate decided, and every human override. */
export default function AuditLog({ entries, light = false }) {
  return (
    <GlassCard plain={light} className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className={`text-sm font-semibold ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>Audit log</h3>
        <span className={`font-mono text-[10px] uppercase tracking-[0.16em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
          {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          <caption className="sr-only">Gate decisions with time, confidence and human override</caption>
          <thead className={`sticky top-0 ${light ? 'bg-[#F7F5F0]' : 'bg-[var(--color-abyss)]'}`}>
            <tr className={`font-mono text-[10px] uppercase tracking-[0.14em] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
              <th scope="col" className="px-4 py-2 font-normal">Time</th>
              <th scope="col" className="px-4 py-2 font-normal">Action</th>
              <th scope="col" className="px-4 py-2 font-normal">Decision</th>
              <th scope="col" className="px-4 py-2 font-normal">Confidence</th>
              <th scope="col" className="px-4 py-2 font-normal">Human override</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className={`px-4 py-6 text-center ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>
                  No actions checked yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className={`border-t ${light ? 'border-[#E4E0D6]' : 'border-white/6'}`}>
                  <td className={`whitespace-nowrap px-4 py-2 font-mono text-[11px] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>{e.time}</td>
                  <td className={`max-w-[18rem] px-4 py-2 ${light ? 'text-[#141B2E]' : 'text-slate-200'}`}>
                    <span className="line-clamp-2">{e.action}</span>
                    {e.influenced ? (
                      <span className="ml-1 font-mono text-[10px] text-[var(--color-spam)]">
                        ⚠ influenced by fetched content
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className="rounded-md px-2 py-0.5 font-mono text-[10px] font-bold"
                      style={{
                        color: DECISIONS[e.decision].color,
                        background: `${DECISIONS[e.decision].color}1f`,
                      }}
                    >
                      {DECISIONS[e.decision].label}
                    </span>
                  </td>
                  <td className={`px-4 py-2 font-mono ${light ? 'text-[#243044]' : 'text-slate-300'}`}>
                    {(e.confidence * 100).toFixed(0)}%
                  </td>
                  <td className={`px-4 py-2 ${light ? 'text-[#243044]' : 'text-slate-300'}`}>
                    {e.override ? (
                      <span
                        style={{
                          color:
                            e.override === 'approved'
                              ? 'var(--color-allow)'
                              : 'var(--color-block)',
                        }}
                      >
                        {e.override === 'approved' ? 'Approved by human' : 'Rejected by human'}
                      </span>
                    ) : (
                      <span className={light ? 'text-[#3E4A5C]' : 'text-slate-500'}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
