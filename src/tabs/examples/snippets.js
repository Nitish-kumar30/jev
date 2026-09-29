/**
 * Readable source for each example. This file is not executed.
 * The live run is the Node port in server/examples.js.
 */

export const EXAMPLES = [
  {
    n: 1,
    title: 'Route a support ticket',
    point:
      'Same classification. One returns a value; the other returns a paragraph that you then have to turn back into a value.',
    takeaway:
      'The LLM path needed parse_json_from(). The Jev path indexed a dict. And only one of them handed you a number you can write an if-statement against.',
    inputLabel: 'Ticket',
    input:
      "Hi, I've been trying to connect my Stripe account for 3 days and the integration keeps failing.",
    code: `TICKET = ("Hi, I've been trying to connect my Stripe account for 3 days "
          "and the integration keeps failing.")

def example_1():
    prompt = (
        "Classify this support ticket into exactly one of: billing, technical, sales.\\n"
        'Reply with ONLY a JSON object like {"department":"technical"} and nothing else.\\n\\n'
        f"Ticket: {TICKET}"
    )
    text, ms, cost = ask_llm(prompt)
    parsed = parse_json_from(text)          # <-- the tax
    dept = (parsed or {}).get("department", "PARSE FAILED")

    answers, ms, cost = ask_jev(TICKET, {
        "department": {
            "type": "choice",
            "instructions": "Which team should handle this ticket?",
            "criteria": {
                "billing": "Payment, invoice or subscription problems",
                "technical": "Bugs, errors, or integration failures",
                "sales": "Pricing, plans, or new account questions",
            },
        }
    })
    d = answers["department"]
    d["choice"]            # already a value. no parsing.
    d.get("confidence")
    d.get("probabilities")`,
  },
  {
    n: 2,
    title: 'Ask five things at once',
    point:
      'The LLM answers all five inside one generation, so the answers can lean on each other. Jev evaluates each question independently in the same request.',
    takeaway:
      'Every question is evaluated independently, so adding more questions does not create context-rot. You can bolt on a sixth question without re-testing the other five.',
    inputLabel: 'Email',
    input: `Subject: renewal + a problem

Hi team — our contract is up next month and honestly I'm not sure we'll renew. The SSO integration has been broken since the April release and we've had three tickets open with no movement. My CFO is asking why we're paying enterprise pricing for this. I'd like to talk before the 30th. Also, can you send the SOC 2 report? Procurement needs it either way.

— Dana, VP Eng`,
    code: `prompt = (
    "Read the email and answer all five questions. Reply with ONLY a JSON object:\\n"
    '{"churn_risk":"low|medium|high","wants_meeting":true/false,'
    '"asks_for_document":true/false,"is_technical_complaint":true/false,'
    '"mentions_pricing":true/false}\\n\\n' + EMAIL
)
text, ms, cost = ask_llm(prompt)
parsed = parse_json_from(text)              # one blob, or None at 3am

answers, ms, cost = ask_jev(EMAIL, {
    "churn_risk": {
        "type": "score",
        "instructions": "How likely is this customer to leave?",
        "criteria": ["Happy, no risk", "Some friction", "Actively considering leaving"],
    },
    "wants_meeting": {"type": "noul", "instructions": "Is the sender asking to speak with someone?"},
    "asks_for_document": {"type": "noul", "instructions": "Is the sender requesting a document or report?"},
    "is_technical_complaint": {"type": "noul", "instructions": "Does the sender describe something that is broken?"},
    "mentions_pricing": {"type": "noul", "instructions": "Does the sender raise cost or pricing as a concern?"},
})`,
  },
  {
    n: 3,
    title: "Know when you don't know",
    point:
      'Four tickets, from clear to genuinely split between two teams. Both sides use the same 0.85 auto-route bar. Watch whose number actually drops.',
    takeaway:
      "Same bar (0.85) on both. The LLM's number is a token it wrote, so it clears the bar on everything. Jev's probability drops on the split tickets, so those go to a human instead of the wrong team.",
    inputLabel: 'Confidence ladder',
    input: `Clear: double-charged on INV-2291.
Mostly clear: Stripe webhook returns 500.
Split, billing vs technical: paid for Pro, still on Free.
Split, billing vs sales: charged $480, asking if annual is cheaper.`,
    code: `AUTO_ROUTE_BAR = 0.85

for label, ticket in CONFIDENCE_LADDER:
    text, ms, cost = ask_llm(
        "Classify into billing, technical, or sales, and rate how confident you are.\\n"
        'Reply with ONLY {"department":"...","confidence":0.0-1.0}\\n\\n'
        f"Ticket: {ticket}"
    )
    p = parse_json_from(text) or {}
    llm_would_route = (p.get("confidence") or 0) >= AUTO_ROUTE_BAR

    answers, ms, cost = ask_jev(ticket, DEPARTMENT_Q)
    probs = answers["department"].get("probabilities") or {}
    jev_top = max(probs.values()) if probs else answers["department"].get("confidence")
    jev_would_route = (jev_top or 0) >= AUTO_ROUTE_BAR`,
  },
  {
    n: 4,
    title: 'Score and rank a batch',
    point:
      'Five pieces of feedback, scored 0–3 for severity, sorted worst-first. This is the shape of work that runs thousands of times a day.',
    takeaway:
      "Each item was scored against the rubric alone, never against its neighbours — so item 5's score does not drift because item 4 was dramatic. You also get a per-item confidence, so the borderline ones can be pulled out.",
    inputLabel: 'Feedback',
    input: `Love the new dashboard, so much faster than before.
Export to CSV has been broken for two weeks. We rely on it daily.
Would be nice to have dark mode at some point.
We lost data during the migration. Nobody has responded to my emails.
The docs could use more examples for the webhooks API.`,
    code: `prompt = (
    "Score each item 0-3 for severity (0=praise, 1=minor, 2=serious, 3=critical).\\n"
    'Reply with ONLY {"scores":[{"index":0,"score":0}, ...]}\\n\\n' + numbered
)
text, ms, cost = ask_llm(prompt)
parsed = parse_json_from(text) or {}
# one call — item 5 was generated after it had already seen items 1-4

for text_item in FEEDBACK:
    answers, ms, cost = ask_jev(text_item, {
        "severity": {
            "type": "score",
            "instructions": "How severe is the problem this customer describes?",
            "criteria": [
                "No problem — praise or neutral",
                "Minor annoyance or a nice-to-have request",
                "Serious: something they rely on is broken",
                "Critical: data loss, outage, or being ignored",
            ],
        }
    })`,
  },
  {
    n: 5,
    title: 'Guard an irreversible action',
    point:
      'Two refunds: a documented $45 and an undocumented $4,200. The bar comes from the amount, so each action gets one verdict.',
    takeaway:
      'The model gives a probability; the business decides the bar. Tighten the bar for big amounts by editing the refund tiers, not the prompt.',
    inputLabel: 'Two proposed refunds',
    input: `$45 — duplicate charge, invoice INV-7710, charge id on file, no prior refunds.
$4,200 — customer says they were overcharged. Two prior refunds this quarter. No invoice or charge id.`,
    code: `REFUND_TIERS = [(100, 0.70), (1_000, 0.90), (10_000, 0.99)]

def bar_for(amount):
    for limit, bar in REFUND_TIERS:
        if amount < limit:
            return bar
    return None  # above every tier: never auto-run

p_safe = answers["safe_to_auto_run"].get("noul") or 0
bar = bar_for(amount)
auto = bar is not None and p_safe >= bar
# "$4,200 needs P >= 0.99, got 0.04 -> needs a human"`,
  },
  {
    n: 6,
    title: 'Jev decides, the LLM writes',
    point:
      'A calm customer and an angry one. Jev picks the route. The LLM only drafts. The escalated path never auto-sends a promise nobody will keep.',
    takeaway:
      'Jev is the routing layer, the LLM is the writing layer. The angry customer gets a human; the calm one gets an instant answer.',
    inputLabel: 'Two customers',
    input: `Calm: where do I change my invoice email? No rush.
Angry: SSO down for two weeks, $4k a month, third email, wants a call today.`,
    code: `ANGER_ESCALATE = 1.3   # 0-2 scale
CALL_ESCALATE = 0.5

anger = answers["anger"].get("score") or 0
p_call = answers["needs_human_call"].get("noul") or 0
escalate = anger >= ANGER_ESCALATE or p_call >= CALL_ESCALATE

if escalate:
    # draft for an agent to edit; do not promise a call time
    sender = "Human agent edits the draft, then sends"
else:
    sender = "Sent automatically"`,
  },
];
