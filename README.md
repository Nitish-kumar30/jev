# Jev vs Chatbot AI: See the Difference

A single-page demo that shows non-technical people how a **decision
model** (Jev by TypeSafe AI) differs from a **normal LLM chatbot**.

A chatbot writes sentences for a person to read. Jev returns a typed decision —
a label, a score, a yes or no — with a probability attached, meant for software
to act on. The tabs make that difference visible:

| Tab | What it shows |
| --- | --- |
| **Ticket Sorting Race** | Both engines sort the same 50 customer messages into Billing / Technical / Refund / Spam, side by side, with live timers, cost and accuracy. Jev shows a confidence bar and hands anything below 70% to a human instead of guessing. |
| **Agent Safety Gate** | Before an AI agent acts, Jev answers allow / ask a human / block, with a confidence value and a plain-English reason. Includes a prompt-injection demo and an honest note about its limits. |
| **Examples** | Six tasks run both ways: chat completions versus Jev on systemone. Each one shows the typed result beside the Python that defines it. Example 6 splits the job: Jev decides whether to escalate, and the LLM writes the reply. This tab only runs in Live mode. |
| **PII Detection** | An animated, replayable recreation of the LangChain video "PII Detection with Jev vs LLM". The same question — does this message contain an email address, a phone number or a credit card number? — goes to an LLM, which takes about 5s to write prose plus JSON, and to Jev, which returns three probabilities in about 0.1s. A third scene puts them side by side with a threshold slider. Works in Demo mode; Live mode also accepts your own text. |

## Run it

Requires Node 18+ (developed on Node 22).

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. That's it — **Demo mode needs no backend, no API
keys and no network.** The race and the gate are simulated in the browser, and
each of those panels carries a `Simulated` badge so nothing on screen is
mistaken for a real result. The Examples tab shows the scenario and the Python
immediately; Run calls the real APIs and only works in Live mode. The PII
Detection tab plays scripted answers in Demo mode and asks both models for real
in Live mode.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Frontend only (Demo mode). This is all you need. |
| `npm run server` | Optional backend on :8787 for Live mode. |
| `npm run dev:all` | Both at once. |
| `npm run build` / `npm run preview` | Production build and preview. |

## Live mode (optional) — where to paste your key

1. `cp server/.env.example server/.env`
2. Paste one OpenRouter key into **`server/.env`**:
   ```
   OPENROUTER_API_KEY=your-openrouter-key
   JEV_MODEL=typesafe/jev-1.13
   LLM_MODEL=openai/gpt-4o-mini
   ```
   The key stays on the server. It is never bundled into the browser, and the
   frontend only ever talks to your own `/api/*` routes. `server/.env` is
   git-ignored, so it is not uploaded with the repo.
3. `npm run dev:all`
4. In the app, open the settings menu (top right) and choose **Live mode**.

On Vercel, the same routes run as one serverless function in this project. You
do not deploy a second backend. In the Vercel project settings, add
`OPENROUTER_API_KEY` (and optionally `JEV_MODEL` and `LLM_MODEL`), then
redeploy. The project root must be the folder that contains `package.json`
and `api/`. After deploy, `https://<your-app>/api/health` should return JSON.

If the backend is not running, or the key is missing, or a request fails, the
app shows a toast and drops back to Demo mode rather than breaking.

The race and the gate call Jev on OpenRouter's Decisions API
(`POST /api/alpha/decisions`) with `typesafe/jev-1.13`. Set
`JEV_MODEL=~typesafe/jev-latest` to follow the newest Jev release. Those
requests are not sent to chat completions. The chatbot side uses
`POST /api/v1/chat/completions` and whatever model id you put in `LLM_MODEL`.

The Examples tab is a different Jev endpoint, matching the six-task script:
`POST /api/v1/systemone` with model `jev-1.13` (OpenRouter maps that to
`typesafe/jev-1.13`). It does not read `JEV_MODEL`. It uses the same
`OPENROUTER_API_KEY` and the same Express app, so it deploys with the existing
Vercel function. There is no Python service.

- **`server/adapters/jev.js`** — Decisions API request and response mapping for
  `jevClassify()` and `jevGate()`.
- **`server/adapters/llm.js`** — chat completions for the chatbot side.
- **`server/examples.js`** — the six examples. Chat completions for the prose
  side, `POST /api/v1/systemone` for Jev. Still the same serverless function.
  It exports `askLlm`, `askJev` and `parseJsonFrom` for reuse.
- **`server/pii.js`** — PII Detection. Calls the LLM and Jev in parallel through
  those same helpers: the LLM writes a sentence and a JSON object, and Jev
  answers three `noul` questions.

The classify and gate adapters return a normalised shape, documented in their JSDoc.

Backend endpoints:

| Route | Body | Returns |
| --- | --- | --- |
| `POST /api/jev/classify` | `{ message }` | `{ label, confidence, latencyMs }` |
| `POST /api/llm/classify` | `{ message }` | `{ label, confidence: null, latencyMs }` |
| `POST /api/jev/gate` | `{ action, fetchedContent? }` | `{ decision, confidence, reason }` |
| `POST /api/examples/:n` | — (`n` is 1–6) | `{ n, models, rounds }` — each round has `llm` and `jev` rows, latency, and cost |
| `POST /api/pii` | `{ message }` (required, up to 2,000 characters) | `{ message, llm: { text, structured, parseFailed, ms, cost }, jev: { answers: { has_email, has_phone, has_credit_card }, ms, cost } }` |
| `GET /api/health` | — | `{ ok, jevKey, llmKey }` |

## Project structure

```
index.html                     Fonts, favicon, mount point
vite.config.js                 Vite + Tailwind, /api proxy for local dev
vercel.json                    Sends /api/* to the serverless function
src/
  main.jsx                     Entry point, mode provider
  App.jsx                      Header, tabs, hero, toasts
  styles/index.css             Theme tokens, glass/glow helpers, reduced motion
  components/
    GridBackdrop.jsx           Animated grid + particle field
    Hero.jsx                   "Chatbots write. Jev decides." + comparison table
    TabNav.jsx                 ARIA tablist with arrow-key support
    SettingsMenu.jsx           Demo / Live switch
    ui.jsx                     Glass card, Simulated badge, animated counters
  lib/
    constants.js               EDIT ME: costs, latencies, error rates, threshold
    engines.js                 Demo + live classification engines (one interface)
    gateEngine.js              Demo keyword/amount rule engine for the gate
    random.js                  Seeded PRNG so a race is reproducible
    api.js                     Browser-side client for /api/*
    ModeContext.jsx            Demo/Live state, toasts, demo fallback
    useReducedMotion.js        prefers-reduced-motion hook
  data/
    tickets.js                 The 50 messages with hidden correct labels
    actions.js                 Gate presets + the prompt-injection email
    piiMessages.js             PII presets with scripted demo answers
  tabs/
    race/  useRace.js, RaceTab.jsx, RacePanel.jsx, Bins.jsx,
           ResultsCard.jsx, DetailDrawer.jsx
    gate/  GateTab.jsx, TrafficLight.jsx, ConfidenceGauge.jsx, AuditLog.jsx
    examples/  ExamplesTab.jsx, CodePanel.jsx, snippets.js, highlight.js
    pii/   PiiTab.jsx, usePiiPlayback.js (the timeline, as data),
           ScenePanel.jsx, LlmResult.jsx, JevResult.jsx, ProbabilityBar.jsx,
           SideBySide.jsx, format.js
api/
  index.js                     Vercel entry; exports the Express app
server/
  app.js                       Express routes: health, classify, gate, examples, pii
  examples.js                  Six Jev-vs-chat runs via systemone + chat completions
  pii.js                       PII Detection: LLM and Jev in parallel
  index.js                     Local listener only (loads server/.env)
  adapters/jev.js              OpenRouter Decisions API (Jev)
  adapters/llm.js              OpenRouter chat completions (chatbot)
  .env.example                 Copy to server/.env and paste keys here
```

## Tuning the demo

All the numbers live in **`src/lib/constants.js`**:

```js
COST_PER_MESSAGE = { llm: 0.002, jev: 0.00001 };   // dollars per message
LATENCY_MS = { llm: {min: 900, max: 1800}, jev: {min: 8, max: 40} };
ERROR_RATE = { llm: 0.08, jev: 0.04 };             // share answered wrongly
CONFIDENCE_THRESHOLD = 0.7;                        // below this: ask a human
```

The dataset is `src/data/tickets.js` — 50 messages, 7 deliberately ambiguous
(e.g. *"charged twice and the app crashed"*) and 5 tricky spam-vs-real cases.

## Honest notes

- **Vendor claims are unverified.** "Up to 200× faster and 400× cheaper" comes
  from TypeSafe AI, and is labelled as such everywhere it appears.
- **Demo-mode figures are illustrative.** They come from the constants above,
  not from measuring a real Jev deployment.
- The race reports **engine time** (time spent classifying) alongside wall
  clock, so the speed-up ratio is not distorted by this page's own animation
  work. Both are measured at run time; nothing is hardcoded.
- **PII Detection demo timings come from the LangChain video, not from
  measurement.** In Demo mode the 5.0s and 0.1s are the figures shown in "PII
  Detection with Jev vs LLM", and the answers are scripted. In Live mode each
  timer stops at the latency measured for that request.
- **Jev returns probabilities only, not an explanation.** The LLM's sentence
  says why; Jev's three numbers do not. If you need a reason a person can read,
  you still need something that writes text.
- **Decision models can be influenced by malicious content.** The gate's
  "Sneaky email" preset demonstrates this deliberately. Do not let fetched
  content authorize its own actions, and keep a human in the loop for
  consequential actions.

## Accessibility

Real `tablist` / `dialog` / `switch` semantics, keyboard operable throughout
(arrow keys between tabs, `Esc` closes the drawer and menus), visible focus
rings, live regions for results, and full `prefers-reduced-motion` support —
the particle field freezes and card flights become fades. In PII Detection,
Space plays and pauses when the tab panel is focused, and with reduced motion
each step appears whole instead of streaming or typing.
