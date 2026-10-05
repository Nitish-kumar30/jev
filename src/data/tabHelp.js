/**
 * Plain-language help for each tab. Written for someone opening the demo
 * for the first time.
 */
export const TAB_HELP = {
  race: {
    title: 'Ticket Sorting Race',
    about:
      'A chatbot and Jev sort the same 50 customer messages. Each message is labelled Billing, Technical, Refund, or Spam. The race shows how fast each one is, what it costs, and how often it is right.',
    steps: [
      'Press Start. Both columns work through the same messages, one at a time.',
      'Use 1×, 2×, or 4× if you want the race to move faster. It does not change the result.',
      'Watch Jev’s confidence bar. Anything below 70% is handed to a person instead of guessed.',
      'Click a ticket to read the message and the label each engine gave it.',
    ],
    modes:
      'Demo mode uses simulated timings and a Simulated badge, so nothing on screen is a live answer. Live mode, from the settings menu, sends the messages through your backend to the real APIs.',
  },
  gate: {
    title: 'Agent Safety Gate',
    about:
      'Before an AI agent does something, Jev answers allow, ask a person, or block. It also gives a confidence value and a short reason, so a risky action can stop instead of going through.',
    steps: [
      'Pick one of the example actions, or type your own.',
      'Run the gate and read the result: green to go ahead, amber to ask a person, red to stop.',
      'Try the sneaky-email example. The fetched message tries to talk the gate into approving itself.',
      'If you disagree with the result, you can override it. The log keeps both answers.',
    ],
    modes:
      'Demo mode is simulated and works with no API key. Live mode calls the real Jev API for the decision.',
  },
  pii: {
    title: 'PII Detection',
    about:
      'The question is simple: does this message contain an email address, a phone number, or a credit card number? A chatbot writes a sentence and some JSON. Jev returns three probabilities, one for each kind of private data.',
    steps: [
      'Pick a sample message, or type your own in Live mode and press Check live.',
      'We look for an actual email address, phone number, or card number — mentioning “email” in a sentence is not the same as containing one.',
      'Scene 01 is the chatbot writing. Scene 02 is Jev’s three probabilities. Scene 03 puts them side by side.',
      'Buttons 01, 02, and 03 jump straight to that finished scene and leave it paused. Press Play to continue, Replay to start over, or Skip to end.',
      'On scene 03, move the threshold slider. A higher bar means Jev must be more sure before a field counts as private data.',
    ],
    modes:
      'Demo mode plays scripted answers from the sample messages. Live mode asks both models for real. The box for your own text is only available in Live mode.',
  },
  router: {
    title: 'Model Router',
    about:
      'Some requests are easy and some are hard. Jev looks at each of 24 requests and picks a cheap fast model or an expensive powerful one, instead of sending every request to the expensive model.',
    steps: [
      'Press Start. Requests move from the queue into the fast lane or the powerful lane.',
      'In Live mode, Pause holds the queue before the next request. The one already in flight still finishes. Resume continues.',
      'The chart compares “send everything to the powerful model” with “let Jev choose”.',
      'After the run, move Fallback below. A higher number sends more unsure requests to the powerful model: fewer mistakes, smaller savings.',
      'Underpowered means a hard job was sent to the cheap model. That is a quality risk, not a saving.',
      'The Python at the bottom is the same idea written for LangChain. This page does not run that code.',
    ],
    modes:
      'Demo mode uses example prices and a simulated error rate. In Live mode, Jev’s choice is real. “Answer each request” is off by default because it calls a real model for all 24 requests and costs real money.',
  },
  examples: {
    title: 'Examples',
    about:
      'Six short tasks, each done two ways. A chatbot writes a sentence for a person to read. Jev returns a typed answer — a label, a score, or a yes or no — for software to act on.',
    steps: [
      'Pick an example in the list on the left.',
      'Read what the task is, then read the Python that defines it.',
      'Press Run to ask both models. Run all does every example.',
      'Example 6 splits the job: Jev decides whether to escalate, and the chatbot writes the reply.',
    ],
    modes:
      'You can read every example in Demo mode. Run only works in Live mode. Open the settings menu and choose Live, using the same key as the other tabs.',
  },
};
