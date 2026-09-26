import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TrafficLight from './TrafficLight.jsx';
import ConfidenceGauge from './ConfidenceGauge.jsx';
import AuditLog from './AuditLog.jsx';
import { GlassCard, SimulatedBadge } from '../../components/ui.jsx';
import { PRESET_ACTIONS, SNEAKY_EMAIL } from '../../data/actions.js';
import { DECISIONS, evaluateAction } from '../../lib/gateEngine.js';
import { gateWithJev } from '../../lib/api.js';
import { useMode } from '../../lib/ModeContext.jsx';

const now = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function GateTab({ light = false }) {
  const { isDemo, isLive, fallbackToDemo } = useMode();
  const [action, setAction] = useState('');
  const [custom, setCustom] = useState('');
  const [sneaky, setSneaky] = useState(false);
  const [seeContent, setSeeContent] = useState(false);
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const [pending, setPending] = useState(false);

  const record = useCallback((entry) => setLog((prev) => [entry, ...prev].slice(0, 50)), []);

  const check = useCallback(
    async (text, { isSneaky = false } = {}) => {
      if (!text.trim()) return;
      setAction(text);
      setSneaky(isSneaky);
      setPending(true);

      const fetchedContent = isSneaky ? SNEAKY_EMAIL.fetchedContent : '';
      let outcome;
      if (isLive) {
        try {
          const res = await gateWithJev({
            action: text,
            fetchedContent: seeContent ? fetchedContent : undefined,
          });
          outcome = {
            decision: res.decision,
            confidence: res.confidence,
            reason: res.reason,
            influenced: Boolean(res.influenced),
          };
        } catch (err) {
          fallbackToDemo(`Live gate request failed: ${err.message}`);
          outcome = evaluateAction(text, { fetchedContent, seeContent });
        }
      } else {
        // A brief pause so the light visibly reacts.
        await new Promise((r) => setTimeout(r, 180));
        outcome = evaluateAction(text, { fetchedContent, seeContent });
      }

      setPending(false);
      const id = crypto.randomUUID();
      setResult({ ...outcome, id, action: text, isSneaky });
      record({
        id,
        time: now(),
        action: text,
        decision: outcome.decision,
        confidence: outcome.confidence,
        influenced: outcome.influenced,
        override: null,
      });
    },
    [isLive, seeContent, fallbackToDemo, record]
  );

  const resolveByHuman = (verdict) => {
    setLog((prev) =>
      prev.map((e) => (e.id === result.id ? { ...e, override: verdict } : e))
    );
    setResult((prev) => ({ ...prev, override: verdict }));
  };

  const decision = result?.decision ?? null;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Agent Safety Gate</h2>
        <p className={`mx-auto mt-2 max-w-2xl text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-400'}`}>
          Before an AI agent does something in the real world, Jev decides whether it may:
          go ahead, check with a person, or stop. The confidence value is what makes the
          middle answer possible.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_auto_1fr]">
        {/* LEFT: proposed action */}
        <GlassCard plain={light} className="p-4">
          <header className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-semibold ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>AI Agent wants to do this</h3>
            {isDemo ? <SimulatedBadge light={light} /> : null}
          </header>

          <div className={`mt-3 min-h-[4.5rem] rounded-xl border p-3 ${light ? 'border-[#E4E0D6] bg-[#F7F5F0]' : 'border-white/10 bg-black/30'}`}>
            {action ? (
              <p className={`text-sm ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>{action}</p>
            ) : (
              <p className={`text-sm ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>Pick an action below, or type your own.</p>
            )}
            {sneaky ? (
              <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-[var(--color-spam)]/40 bg-[var(--color-spam)]/10 p-2 font-mono text-[10px] leading-relaxed text-slate-300">
                {SNEAKY_EMAIL.fetchedContent}
              </pre>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESET_ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => check(a.text)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                  light
                    ? 'border-[#E4E0D6] bg-[#FDFCFA] text-[#141B2E] hover:border-[#00897B]'
                    : 'border-white/12 bg-white/[0.03] text-slate-200 hover:border-[var(--color-jev)]/60 hover:text-white'
                }`}
              >
                {a.text}
              </button>
            ))}
            <button
              type="button"
              onClick={() => check(SNEAKY_EMAIL.text, { isSneaky: true })}
              className="rounded-lg border border-[var(--color-spam)]/60 bg-[var(--color-spam)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-spam)] transition hover:bg-[var(--color-spam)]/20"
            >
              ⚠ Sneaky email (prompt injection)
            </button>
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              check(custom);
            }}
          >
            <label className="sr-only" htmlFor="custom-action">
              Describe your own action
            </label>
            <input
              id="custom-action"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Or type your own action, e.g. Refund $75"
              className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm placeholder:text-[#3E4A5C] ${
                light
                  ? 'border-[#E4E0D6] bg-[#FDFCFA] text-[#141B2E]'
                  : 'border-white/12 bg-black/30 text-slate-100 placeholder:text-slate-500'
              }`}
            />
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                light
                  ? 'bg-[#00897B] text-white'
                  : 'bg-[var(--color-jev)]/20 text-[var(--color-jev)] ring-1 ring-[var(--color-jev)]/50'
              }`}
            >
              Check
            </button>
          </form>

          {/* Injection toggle */}
          <div className={`mt-4 rounded-xl border p-3 ${light ? 'border-[#E4E0D6] bg-[#F7F5F0]' : 'border-white/10 bg-black/25'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={`text-xs font-semibold ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>
                  Gate sees fetched content
                </div>
                <p className={`mt-0.5 text-[11px] leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-400'}`}>
                  OFF is the recommended design: the gate judges the action only, never the
                  text the agent fetched.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={seeContent}
                onClick={() => setSeeContent((v) => !v)}
                className={`relative h-7 w-14 shrink-0 rounded-full border transition ${
                  seeContent
                    ? 'border-[var(--color-spam)] bg-[var(--color-spam)]/30'
                    : light
                      ? 'border-[#E4E0D6] bg-[#E4E0D6]'
                      : 'border-white/15 bg-white/10'
                }`}
              >
                <span className="sr-only">Toggle whether the gate reads fetched content</span>
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white"
                  style={{ left: seeContent ? 'calc(100% - 1.5rem)' : '0.25rem' }}
                />
                <span className={`absolute -bottom-5 right-0 font-mono text-[10px] ${light ? 'text-[#3E4A5C]' : 'text-slate-400'}`}>
                  {seeContent ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* CENTER: traffic light */}
        <div className="flex items-center justify-center">
          <TrafficLight decision={pending ? null : decision} light={light} />
        </div>

        {/* RIGHT: confidence + reason */}
        <GlassCard plain={light} className="flex flex-col p-4">
          <header className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-semibold ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>Jev's answer</h3>
            {isDemo ? <SimulatedBadge light={light} /> : null}
          </header>

          <div className="mt-2">
            <ConfidenceGauge value={result ? result.confidence : null} decision={decision} light={light} />
          </div>

          <div aria-live="polite" className="mt-2">
            {result ? (
              <>
                <p
                  className="text-sm font-semibold"
                  style={{ color: DECISIONS[result.decision].color }}
                >
                  {DECISIONS[result.decision].plain}
                </p>
                <p className={`mt-1 text-sm leading-relaxed ${light ? 'text-[#243044]' : 'text-slate-300'}`}>{result.reason}</p>
              </>
            ) : (
              <p className={`text-sm ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>
                No action checked yet. The gate returns a decision, a confidence value and a
                one-line reason — not an essay.
              </p>
            )}
          </div>

          {/* Human in the loop for the yellow state */}
          <AnimatePresence>
            {result?.decision === 'ask' ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-xl border border-[var(--color-ask)]/40 bg-[var(--color-ask)]/10 p-3"
              >
                {result.override ? (
                  <p className={`text-sm ${light ? 'text-[#141B2E]' : 'text-slate-100'}`}>
                    Human {result.override === 'approved' ? 'approved' : 'rejected'} this action.
                    Logged below.
                  </p>
                ) : (
                  <>
                    <p className={`text-xs ${light ? 'text-[#141B2E]' : 'text-slate-200'}`}>
                      Waiting on a person. This is where a human decides.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => resolveByHuman('approved')}
                        className="rounded-lg bg-[var(--color-allow)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--color-allow)] ring-1 ring-[var(--color-allow)]/50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveByHuman('rejected')}
                        className="rounded-lg bg-[var(--color-block)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--color-block)] ring-1 ring-[var(--color-block)]/50"
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </GlassCard>
      </div>

      {/* Honest-limit banner for the injection demo */}
      <AnimatePresence>
        {result?.influenced ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="rounded-2xl border border-[var(--color-spam)] bg-[var(--color-spam)]/12 p-4"
          >
            <h4 className="text-sm font-bold text-[var(--color-spam)]">
              Honest limit: decision models can be influenced by malicious content
            </h4>
            <p className={`mt-1.5 text-sm leading-relaxed ${light ? 'text-[#141B2E]' : 'text-slate-200'}`}>
              Do not let fetched content authorize its own actions, and keep a human in the loop
              for consequential actions. This ON case is an illustration of the risk: the gate was
              allowed to read the email, the email told it to approve, and it returned a lenient
              green at low confidence. Switch the toggle back to OFF to see the safer design.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AuditLog entries={log} light={light} />

      <p className={`text-center text-[11px] ${light ? 'text-[#3E4A5C]' : 'text-slate-500'}`}>
        {isDemo
          ? 'Demo mode: decisions come from a small keyword and amount rule engine, not from a real model.'
          : 'Live mode: decisions come from your backend’s Jev gate endpoint.'}
      </p>
    </div>
  );
}
