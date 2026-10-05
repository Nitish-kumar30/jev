/**
 * 24 requests to an AI assistant at a SaaS company, for the Model Router tab.
 *
 * `tier` is the hidden correct answer: the cheapest model that can do the job.
 * `borderline: true` marks requests reasonable people could route either way.
 * `tokens` is a rough estimate of prompt (`in`) and reply (`out`) size; the
 * demo prices every request from these and the list prices in constants.js.
 *
 * The order is hand-shuffled so the hard requests are spread through the run.
 */

export const ROUTER_TIERS = ['fast', 'powerful'];

export const ROUTER_REQUESTS = [
  { id: 1, text: "What's my order status for #A-1043?", tier: 'fast', tokens: { in: 150, out: 80 } },
  { id: 2, text: 'Change my billing email to finance@acme.io', tier: 'fast', tokens: { in: 160, out: 70 } },
  {
    id: 3,
    text: 'Design a migration plan from our monolith to services without downtime',
    tier: 'powerful',
    tokens: { in: 1800, out: 1500 },
  },
  { id: 4, text: "Translate 'payment received' into Spanish", tier: 'fast', tokens: { in: 120, out: 40 } },
  {
    id: 5,
    text: 'Write a SQL query joining orders, refunds and customers with a 30-day window',
    tier: 'fast',
    borderline: true,
    tokens: { in: 400, out: 250 },
  },
  { id: 6, text: 'Extract the invoice number from this text', tier: 'fast', tokens: { in: 600, out: 30 } },
  {
    id: 7,
    text: 'Review this contract clause for liability risk',
    tier: 'powerful',
    tokens: { in: 1200, out: 900 },
  },
  { id: 8, text: 'What are your support hours?', tier: 'fast', tokens: { in: 110, out: 60 } },
  {
    id: 9,
    text: 'Rename the variable `usr` to `user` in this function',
    tier: 'fast',
    tokens: { in: 450, out: 420 },
  },
  {
    id: 10,
    text: 'Summarize this 40-page RFP and flag anything unusual',
    tier: 'powerful',
    borderline: true,
    tokens: { in: 16000, out: 900 },
  },
  { id: 11, text: "Convert the date '03/04/2026' to ISO 8601", tier: 'fast', tokens: { in: 120, out: 30 } },
  {
    id: 12,
    text: 'Find the root cause of this intermittent race condition from these logs',
    tier: 'powerful',
    tokens: { in: 4000, out: 1100 },
  },
  {
    id: 13,
    text: "Tag this ticket as billing or technical: 'card declined at checkout'",
    tier: 'fast',
    tokens: { in: 160, out: 20 },
  },
  {
    id: 14,
    text: 'Refactor this 200-line function for readability',
    tier: 'fast',
    borderline: true,
    tokens: { in: 2600, out: 2400 },
  },
  { id: 15, text: 'How many seats are on our current plan?', tier: 'fast', tokens: { in: 140, out: 50 } },
  {
    id: 16,
    text: 'Draft our incident postmortem with contributing factors',
    tier: 'powerful',
    tokens: { in: 3000, out: 1600 },
  },
  {
    id: 17,
    text: "Fix the typo in this error message: 'Your sesion has expired'",
    tier: 'fast',
    tokens: { in: 130, out: 40 },
  },
  {
    id: 18,
    text: 'Explain why our churn went up last month from this dashboard',
    tier: 'powerful',
    borderline: true,
    tokens: { in: 2200, out: 800 },
  },
  {
    id: 19,
    text: 'Write a one-line commit message for this 12-line diff',
    tier: 'fast',
    tokens: { in: 500, out: 30 },
  },
  {
    id: 20,
    text: 'Compare three pricing strategies for our enterprise tier and recommend one',
    tier: 'powerful',
    tokens: { in: 1500, out: 1300 },
  },
  {
    id: 21,
    text: 'Turn these three bullet points into a short Slack update',
    tier: 'fast',
    tokens: { in: 250, out: 120 },
  },
  {
    id: 22,
    text: 'Plan a data retention policy that satisfies GDPR and our SOC 2 controls',
    tier: 'powerful',
    tokens: { in: 1400, out: 1400 },
  },
  {
    id: 23,
    text: "Resend the password reset link — it isn't arriving at my account email",
    tier: 'fast',
    tokens: { in: 140, out: 70 },
  },
  {
    id: 24,
    text: 'Design the permission model for multi-tenant workspaces with shared projects',
    tier: 'powerful',
    tokens: { in: 1500, out: 1500 },
  },
];
