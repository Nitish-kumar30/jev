/**
 * The six Jev-vs-chat examples, ported from the stdlib Python script.
 *
 * Chat goes to /api/v1/chat/completions. Jev goes to /api/v1/systemone.
 * These are not the Decisions API routes used by the race and the gate.
 * The Jev model id is jev-1.13, which OpenRouter maps to typesafe/jev-1.13.
 * JEV_MODEL is left alone — that env var is for /api/alpha/decisions.
 */

const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SYSTEMONE_URL = 'https://openrouter.ai/api/v1/systemone';

const LLM_MODEL = () => process.env.LLM_MODEL || 'openai/gpt-4o-mini';
const JEV_EXAMPLES_MODEL = 'jev-1.13';

const CALL_TIMEOUT_MS = 25000;

export const openRouterKey = () =>
  process.env.OPENROUTER_API_KEY || process.env.JEV_API_KEY || process.env.LLM_API_KEY || '';

const TICKET =
  "Hi, I've been trying to connect my Stripe account for 3 days and the integration keeps failing.";

const EMAIL = `Subject: renewal + a problem

Hi team — our contract is up next month and honestly I'm not sure we'll renew. The SSO integration has been broken since the April release and we've had three tickets open with no movement. My CFO is asking why we're paying enterprise pricing for this. I'd like to talk before the 30th. Also, can you send the SOC 2 report? Procurement needs it either way.

— Dana, VP Eng`;

const CLEAR =
  'I was double-charged for invoice INV-2291 on the 14th. Please refund the duplicate.';
const VAGUE = "hi it's not working again, please help, I already paid you";

const FEEDBACK = [
  'Love the new dashboard, so much faster than before.',
  'Export to CSV has been broken for two weeks. We rely on it daily.',
  'Would be nice to have dark mode at some point.',
  'We lost data during the migration. Nobody has responded to my emails.',
  'The docs could use more examples for the webhooks API.',
];

const PROPOSED_ACTION =
  "Agent proposes to execute: issue_refund(customer_id=88213, amount_usd=4200.00, reason='customer says they were overcharged'). Account history: 2 prior refunds this quarter totalling $310. No invoice or charge ID was provided in the request.";

const ANGRY =
  "This is the third time I've written. Our SSO has been down for two weeks, we're paying $4k a month, and nobody has replied. I want someone to call me today.";

const DEPARTMENT = {
  type: 'choice',
  instructions: 'Which team should handle this ticket?',
  criteria: {
    billing: 'Payment, invoice or subscription problems',
    technical: 'Bugs, errors, or integration failures',
    sales: 'Pricing, plans, or new account questions',
  },
};

function show(value) {
  if (value === undefined || value === null) return 'none';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

async function post(url, payload) {
  const started = Date.now();
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey()}`,
        'Content-Type': 'application/json',
        'X-Title': 'jev-vs-llm examples',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err?.name === 'TimeoutError' ? `timed out after ${CALL_TIMEOUT_MS}ms` : err.message;
    throw new Error(`${url}: ${reason}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${res.status} from ${url}: ${detail.slice(0, 500)}`);
  }

  const body = await res.json();
  return { body, ms: Date.now() - started };
}

async function askLlm(prompt, maxTokens = 500) {
  const { body, ms } = await post(CHAT_URL, {
    model: LLM_MODEL(),
    usage: { include: true },
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = body?.choices?.[0]?.message?.content ?? '';
  return { text, ms, cost: body?.usage?.cost ?? null };
}

async function askJev(state, questions) {
  const { body, ms } = await post(SYSTEMONE_URL, {
    model: JEV_EXAMPLES_MODEL,
    state,
    questions,
  });
  return { answers: body?.answers ?? {}, ms, cost: body?.usage?.cost ?? null };
}

/**
 * Dig a JSON object out of prose, markdown fences, or a preamble.
 * The Jev path has no equivalent — the answer is already typed.
 */
export function parseJsonFrom(text) {
  let cleaned = String(text ?? '').trim();
  cleaned = cleaned.replace(/^```(?:json)?/, '').trim();
  cleaned = cleaned.replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* still prose */
      }
    }
  }
  return null;
}

function side(result) {
  return { ms: result.ms, cost: result.cost };
}

function models() {
  return { llm: LLM_MODEL(), jev: JEV_EXAMPLES_MODEL };
}

async function example1() {
  const prompt =
    'Classify this support ticket into exactly one of: billing, technical, sales.\n' +
    'Reply with ONLY a JSON object like {"department":"technical"} and nothing else.\n\n' +
    `Ticket: ${TICKET}`;

  const [llm, jev] = await Promise.all([
    askLlm(prompt),
    askJev(TICKET, { department: DEPARTMENT }),
  ]);

  const parsed = parseJsonFrom(llm.text);
  const dept = parsed?.department ?? 'PARSE FAILED';
  const d = jev.answers.department ?? {};

  return {
    n: 1,
    models: models(),
    rounds: [
      {
        input: TICKET,
        llm: {
          ...side(llm),
          rows: [
            { label: 'raw response', value: llm.text },
            { label: 'after parsing', value: dept, emphasis: parsed ? null : 'fail' },
            { label: 'confidence', value: 'none offered — you cannot gate on anything' },
          ],
        },
        jev: {
          ...side(jev),
          rows: [
            { label: 'department', value: show(d.choice) },
            { label: 'confidence', value: show(d.confidence) },
            { label: 'full spread', value: show(d.probabilities) },
          ],
        },
      },
    ],
  };
}

async function example2() {
  const prompt =
    'Read the email and answer all five questions. Reply with ONLY a JSON object:\n' +
    '{"churn_risk":"low|medium|high","wants_meeting":true/false,' +
    '"asks_for_document":true/false,"is_technical_complaint":true/false,' +
    '"mentions_pricing":true/false}\n\n' +
    EMAIL;

  const [llm, jev] = await Promise.all([
    askLlm(prompt),
    askJev(EMAIL, {
      churn_risk: {
        type: 'score',
        instructions: 'How likely is this customer to leave?',
        criteria: ['Happy, no risk', 'Some friction', 'Actively considering leaving'],
      },
      wants_meeting: {
        type: 'noul',
        instructions: 'Is the sender asking to speak with someone?',
      },
      asks_for_document: {
        type: 'noul',
        instructions: 'Is the sender requesting a document or report?',
      },
      is_technical_complaint: {
        type: 'noul',
        instructions: 'Does the sender describe something that is broken?',
      },
      mentions_pricing: {
        type: 'noul',
        instructions: 'Does the sender raise cost or pricing as a concern?',
      },
    }),
  ]);

  const parsed = parseJsonFrom(llm.text);
  const llmRows = parsed
    ? Object.entries(parsed).map(([label, value]) => ({ label, value: show(value) }))
    : [{ label: 'parse failed', value: llm.text.slice(0, 200), emphasis: 'fail' }];

  const jevRows = Object.entries(jev.answers).map(([label, answer]) => {
    const a = answer ?? {};
    if (a.type === 'score' || 'score' in a) {
      return { label, value: `${show(a.score)}  (confidence ${show(a.confidence)})` };
    }
    return { label, value: show(a.noul) };
  });

  return {
    n: 2,
    models: models(),
    rounds: [
      {
        input: EMAIL,
        llm: {
          ...side(llm),
          rows: llmRows,
          note: 'All five produced in one pass — one long answer, no per-answer certainty.',
        },
        jev: { ...side(jev), rows: jevRows },
      },
    ],
  };
}

async function classifyPair(ticket) {
  const prompt =
    'Classify into billing, technical, or sales, and rate how confident you are.\n' +
    'Reply with ONLY {"department":"...","confidence":0.0-1.0}\n\n' +
    `Ticket: ${ticket}`;

  const [llm, jev] = await Promise.all([
    askLlm(prompt),
    askJev(ticket, { department: DEPARTMENT }),
  ]);
  const parsed = parseJsonFrom(llm.text) ?? {};
  const d = jev.answers.department ?? {};
  return {
    input: ticket,
    llm: {
      ...side(llm),
      rows: [
        {
          label: 'says',
          value: `${show(parsed.department)} at confidence ${show(parsed.confidence)}`,
        },
      ],
    },
    jev: {
      ...side(jev),
      rows: [
        { label: 'says', value: `${show(d.choice)} at confidence ${show(d.confidence)}` },
        { label: 'spread', value: show(d.probabilities) },
      ],
    },
  };
}

async function example3() {
  const [clear, vague] = await Promise.all([classifyPair(CLEAR), classifyPair(VAGUE)]);
  return {
    n: 3,
    models: models(),
    rounds: [
      { caption: 'Clear-cut input', ...clear },
      { caption: 'Ambiguous input', ...vague },
    ],
  };
}

async function example4() {
  const numbered = FEEDBACK.map((text, i) => `${i}. ${text}`).join('\n');
  const prompt =
    'Score each item 0-3 for severity (0=praise, 1=minor, 2=serious, 3=critical).\n' +
    'Reply with ONLY {"scores":[{"index":0,"score":0}, ...]}\n\n' +
    numbered;

  const severityQuestion = {
    severity: {
      type: 'score',
      instructions: 'How severe is the problem this customer describes?',
      criteria: [
        'No problem — praise or neutral',
        'Minor annoyance or a nice-to-have request',
        'Serious: something they rely on is broken',
        'Critical: data loss, outage, or being ignored',
      ],
    },
  };

  const [llm, ...jevCalls] = await Promise.all([
    askLlm(prompt),
    ...FEEDBACK.map((item) => askJev(item, severityQuestion)),
  ]);

  const parsed = parseJsonFrom(llm.text) ?? {};
  const rows = Array.isArray(parsed.scores) ? parsed.scores : [];
  const llmRows = [...rows]
    .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
    .map((row) => ({
      label: show(row?.score),
      value: FEEDBACK[row?.index]?.slice(0, 58) ?? 'missing index',
    }));

  let jevMs = 0;
  let jevCost = 0;
  let jevCostKnown = false;
  const scored = jevCalls.map((call, index) => {
    jevMs += call.ms;
    if (typeof call.cost === 'number') {
      jevCost += call.cost;
      jevCostKnown = true;
    }
    const severity = call.answers.severity ?? {};
    return {
      score: severity.score ?? 0,
      label: show(severity.score),
      value: `(conf ${show(severity.confidence)})  ${FEEDBACK[index].slice(0, 48)}`,
    };
  });
  scored.sort((a, b) => b.score - a.score);

  return {
    n: 4,
    models: models(),
    rounds: [
      {
        input: FEEDBACK.join('\n'),
        llm: {
          ...side(llm),
          rows: llmRows.length
            ? llmRows
            : [{ label: 'parse failed', value: llm.text.slice(0, 200), emphasis: 'fail' }],
          note: 'One call, but the scores were generated in sequence — item 5 saw items 1–4.',
        },
        jev: {
          ms: jevMs,
          cost: jevCostKnown ? jevCost : null,
          rows: scored.map(({ label, value }) => ({ label, value })),
          note: 'Five independent calls. Latency and cost are the sum.',
        },
      },
    ],
  };
}

async function example5() {
  const prompt =
    'Should this automated action be allowed to run without human approval? ' +
    'Reply with ONLY {"allow":true/false,"reason":"..."}\n\n' +
    PROPOSED_ACTION;

  const [llm, jev] = await Promise.all([
    askLlm(prompt),
    askJev(PROPOSED_ACTION, {
      safe_to_auto_run: {
        type: 'noul',
        instructions: 'Is it safe to run this action automatically, with no human check?',
      },
    }),
  ]);

  const parsed = parseJsonFrom(llm.text) ?? {};
  const pSafe = jev.answers.safe_to_auto_run?.noul ?? 0;
  const bars = [
    [100, 0.7],
    [1000, 0.9],
    [10000, 0.99],
  ];

  return {
    n: 5,
    models: models(),
    rounds: [
      {
        input: PROPOSED_ACTION,
        llm: {
          ...side(llm),
          rows: [
            { label: 'allow', value: show(parsed.allow) },
            { label: 'reason', value: String(parsed.reason ?? 'none').slice(0, 70) },
          ],
          note: 'A bare true/false. No dial. You cannot make this stricter for big amounts.',
        },
        jev: {
          ...side(jev),
          rows: [
            { label: 'P(safe)', value: show(jev.answers.safe_to_auto_run?.noul) },
            ...bars.map(([limit, bar]) => ({
              label: `under $${limit}`,
              value: `P >= ${bar}  →  ${(pSafe || 0) >= bar ? 'auto-run' : 'needs a human'}`,
            })),
          ],
        },
      },
    ],
  };
}

async function example6() {
  const [llm, jev] = await Promise.all([
    askLlm(
      'Write a short, warm, non-defensive reply to this customer. Three sentences max.\n\n' +
        `Customer wrote: ${ANGRY}`
    ),
    askJev(ANGRY, {
      needs_human_call: {
        type: 'noul',
        instructions: 'Is this customer asking for a phone call from a person?',
      },
      anger: {
        type: 'score',
        instructions: 'How angry is this customer?',
        criteria: ['Calm', 'Frustrated but civil', 'Very angry'],
      },
    }),
  ]);

  const anger = jev.answers.anger?.score;
  const wantsCall = (jev.answers.needs_human_call?.noul || 0) >= 0.5;
  const hot = anger != null && anger >= 2;

  return {
    n: 6,
    models: models(),
    rounds: [
      {
        input: ANGRY,
        llm: {
          ...side(llm),
          prose: llm.text.trim(),
          rows: [],
        },
        jev: {
          ms: null,
          cost: null,
          rows: [],
          absent:
            'Jev answers choice / score / noul. Asking it to draft an email is a category error, like asking a thermometer for the weather forecast.',
        },
      },
      {
        caption: 'The pattern you actually ship — Jev decides, the LLM writes',
        llm: {
          ms: null,
          cost: null,
          rows: [],
          note: hot
            ? 'Anger is at the top of the scale, so this never gets auto-replied. It pages a human, and the LLM drafts a suggestion for them to edit.'
            : 'Calm enough to auto-reply; the LLM drafts it and it goes out.',
        },
        jev: {
          ...side(jev),
          rows: [
            { label: 'anger', value: show(anger) },
            { label: 'wants a call', value: show(wantsCall) },
          ],
        },
      },
    ],
  };
}

const RUNNERS = {
  1: example1,
  2: example2,
  3: example3,
  4: example4,
  5: example5,
  6: example6,
};

export function runExample(n) {
  const fn = RUNNERS[n];
  if (!fn) throw new Error(`No example ${n}`);
  return fn();
}
