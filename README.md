# Jev vs Chatbot AI: See the Difference

A single-page, two-tab demo that shows non-technical people how a **decision
model** (Jev by TypeSafe AI) differs from a **normal LLM chatbot**.

A chatbot writes sentences for a person to read. Jev returns a typed decision —
a label, a score, a yes or no — with a probability attached, meant for software
to act on. The two tabs make that difference visible:

| Tab | What it shows |
| --- | --- |
| **Ticket Sorting Race** | Both engines sort the same 50 customer messages into Billing / Technical / Refund / Spam, side by side, with live timers, cost and accuracy. Jev shows a confidence bar and hands anything below 70% to a human instead of guessing. |
| **Agent Safety Gate** | Before an AI agent acts, Jev answers allow / ask a human / block, with a confidence value and a plain-English reason. Includes a prompt-injection demo and an honest note about its limits. |

## Run it

Requires Node 18+ (developed on Node 22).

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. That's it — **Demo mode needs no backend, no API
keys and no network.** Every engine is simulated in the browser, and each panel
carries a `Simulated` badge so nothing on screen is mistaken for a real result.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Frontend only (Demo mode). This is all you need. |
| `npm run server` | Optional backend on :8787 for Live mode. |
| `npm run dev:all` | Both at once. |
| `npm run build` / `npm run preview` | Production build and preview. |

## Live mode (optional) — where to paste your keys

1. `cp server/.env.example server/.env`
2. Paste your keys into **`server/.env`**:
   ```
   JEV_API_KEY=your-typesafe-key
   LLM_API_KEY=your-llm-key
   ```
   Keys stay on the server. They are never bundled into the browser, and the
   frontend only ever talks to your own `/api/*` routes.
3. `npm run dev:all`
4. In the app, open the settings menu (top right) and choose **Live mode**.

If the backend is not running, or a key is missing, or a request fails, the app
shows a toast and drops back to Demo mode rather than breaking.

### Filling in the TypeSafe request format

Everything vendor-specific is isolated in two files, each marked with `TODO`
comments:

- **`server/adapters/jev.js`** — endpoint paths, auth header, request body and
  response mapping for `jevClassify()` and `jevGate()`.
- **`server/adapters/llm.js`** — the chatbot side (defaults to the Anthropic
  Messages API; swap it for any provider).

Nothing else in the app needs to change: both adapters return a normalised
shape, documented in their JSDoc.

Backend endpoints:

| Route | Body | Returns |
| --- | --- | --- |
| `POST /api/jev/classify` | `{ message }` | `{ label, confidence, latencyMs }` |
| `POST /api/llm/classify` | `{ message }` | `{ label, confidence: null, latencyMs }` |
| `POST /api/jev/gate` | `{ action, fetchedContent? }` | `{ decision, confidence, reason }` |
| `GET /api/health` | — | `{ ok, jevKey, llmKey }` |

## Project structure

```
index.html                     Fonts, favicon, mount point
vite.config.js                 Vite + Tailwind, /api proxy to the backend
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
  tabs/
    race/  useRace.js, RaceTab.jsx, RacePanel.jsx, Bins.jsx,
           ResultsCard.jsx, DetailDrawer.jsx
    gate/  GateTab.jsx, TrafficLight.jsx, ConfidenceGauge.jsx, AuditLog.jsx
server/
  index.js                     Express app, the three routes + /api/health
  adapters/jev.js              TODO: TypeSafe request format
  adapters/llm.js              TODO: chatbot provider request format
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
- **Decision models can be influenced by malicious content.** The gate's
  "Sneaky email" preset demonstrates this deliberately. Do not let fetched
  content authorize its own actions, and keep a human in the loop for
  consequential actions.

## Accessibility

Real `tablist` / `dialog` / `switch` semantics, keyboard operable throughout
(arrow keys between tabs, `Esc` closes the drawer and menus), visible focus
rings, live regions for results, and full `prefers-reduced-motion` support —
the particle field freezes and card flights become fades.
