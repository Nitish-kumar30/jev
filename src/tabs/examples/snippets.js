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
      'Ask a chat model how confident it is and it will tell you a number it made up. Watch what each one does when the input goes from clear to genuinely ambiguous.',
    takeaway:
      "A self-reported score tends to sit high whatever you feed it — it is a token the model generated, not a measurement. Jev's number is trained to move. That difference is the entire basis for automating anything safely.",
    inputLabel: 'Two tickets',
    input:
      'Clear: "I was double-charged for invoice INV-2291 on the 14th. Please refund the duplicate."\n\nAmbiguous: "hi it\'s not working again, please help, I already paid you"',
    code: `prompt = (
    "Classify into billing, technical, or sales, and rate how confident you are.\\n"
    'Reply with ONLY {"department":"...","confidence":0.0-1.0}\\n\\n'
    f"Ticket: {ticket}"
)
text, ms, cost = ask_llm(prompt)
p = parse_json_from(text) or {}
# p["confidence"] is a token the model wrote

answers, ms, cost = ask_jev(ticket, {
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
# if d["confidence"] >= 0.85: route_it()
# else:                       human_review()`,
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
      'Before an agent spends real money, something has to say yes or no. That gate needs to be a number, not a sentence.',
    takeaway:
      'A boolean is a decision someone else made for you. A probability is an input to a decision you make, and you can set a different bar for a $50 refund than for a $50,000 one without touching the model.',
    inputLabel: 'Proposed action',
    input:
      "Agent proposes to execute: issue_refund(customer_id=88213, amount_usd=4200.00, reason='customer says they were overcharged'). Account history: 2 prior refunds this quarter totalling $310. No invoice or charge ID was provided in the request.",
    code: `prompt = ("Should this automated action be allowed to run without human approval? "
          'Reply with ONLY {"allow":true/false,"reason":"..."}\\n\\n' + PROPOSED_ACTION)
text, ms, cost = ask_llm(prompt)
p = parse_json_from(text) or {}
p.get("allow")                 # a bare true/false. no dial.

answers, ms, cost = ask_jev(PROPOSED_ACTION, {
    "safe_to_auto_run": {
        "type": "noul",
        "instructions": "Is it safe to run this action automatically, with no human check?",
    }
})
p_safe = answers["safe_to_auto_run"].get("noul")
for limit, bar in ((100, 0.70), (1000, 0.90), (10000, 0.99)):
    verdict = "auto-run" if (p_safe or 0) >= bar else "needs a human"`,
  },
  {
    n: 6,
    title: 'Write a customer reply',
    wrongTool: true,
    point:
      'If the last five examples made Jev look strictly better, this one is the correction. Jev gives up string generation.',
    takeaway:
      'Jev is the routing and gating layer. The LLM is the writing layer. The interesting systems use both, and the boring failure mode is picking one and forcing it to do the other job.',
    inputLabel: 'Customer',
    input:
      "This is the third time I've written. Our SSO has been down for two weeks, we're paying $4k a month, and nobody has replied. I want someone to call me today.",
    code: `# WITH A CHAT LLM — it writes
text, ms, cost = ask_llm(
    "Write a short, warm, non-defensive reply to this customer. Three sentences max.\\n\\n"
    f"Customer wrote: {ANGRY}"
)

# WITH JEV — it cannot. There is no question type that returns prose.
# Jev answers choice / score / noul.

# THE PATTERN YOU ACTUALLY SHIP — Jev decides, the LLM writes
answers, ms_j, cost_j = ask_jev(ANGRY, {
    "needs_human_call": {
        "type": "noul",
        "instructions": "Is this customer asking for a phone call from a person?",
    },
    "anger": {
        "type": "score",
        "instructions": "How angry is this customer?",
        "criteria": ["Calm", "Frustrated but civil", "Very angry"],
    },
})
anger = answers["anger"].get("score")
if anger is not None and anger >= 2:
    # page a human; the LLM only drafts a suggestion
    pass
else:
    # calm enough to auto-reply; the LLM drafts it
    pass`,
  },
];
