/**
 * Presets for the PII Detection tab.
 *
 * Each one carries the scripted results Demo mode plays back. Timings are the
 * ones shown in the LangChain video "PII Detection with Jev vs LLM" (about 5s
 * for the LLM, 0.1s for Jev). They are not measurements.
 */

export const PII_FIELDS = [
  { key: 'has_email', question: 'contains an email address' },
  { key: 'has_phone', question: 'contains a phone number' },
  { key: 'has_credit_card', question: 'contains a credit card number' },
];

export const PII_INSTRUCTIONS =
  'figure out if this contains an email address, a phone number, or a credit card number';

export const VIDEO_TIMINGS = { llmMs: 5000, jevMs: 100 };

export const PII_PRESETS = [
  {
    id: 'video',
    label: 'Order + contact details',
    hint: 'the message from the video',
    message: "order #A-1043 hasn't shipped. reach me at dana.ruiz@northwind.co or (415) 555-0147.",
    llm: {
      text:
        'Yes, this message does appear to contain personally identifiable information – an email address and a phone number, but no credit card number.',
      structured: { has_email: true, has_phone: true, has_credit_card: false },
    },
    jev: { has_email: 0.99, has_phone: 0.98, has_credit_card: 0.02 },
  },
  {
    id: 'card',
    label: 'Card number',
    hint: 'a test card, 4242…',
    message: 'please update the card on file to 4242 4242 4242 4242, exp 12/28. thanks!',
    llm: {
      text:
        'Yes, this message contains personally identifiable information – a credit card number, but no email address or phone number.',
      structured: { has_email: false, has_phone: false, has_credit_card: true },
    },
    jev: { has_email: 0.02, has_phone: 0.04, has_credit_card: 0.97 },
  },
  {
    id: 'clean',
    label: 'No PII',
    hint: 'a plain bug report',
    message: "the export button on the reports page has been greyed out since tuesday's update.",
    llm: {
      text:
        'No, this message does not appear to contain any personally identifiable information – no email address, phone number, or credit card number.',
      structured: { has_email: false, has_phone: false, has_credit_card: false },
    },
    jev: { has_email: 0.01, has_phone: 0.02, has_credit_card: 0.01 },
  },
  {
    id: 'tricky',
    label: 'Tricky',
    hint: 'spelled-out email, phone-like order number',
    message: 'email me at dana at northwind dot co about order 415-555-0199, the one that shipped late.',
    llm: {
      text:
        'Yes, this message appears to contain an email address written out in words and a phone number, but no credit card number.',
      structured: { has_email: true, has_phone: true, has_credit_card: false },
    },
    jev: { has_email: 0.71, has_phone: 0.46, has_credit_card: 0.03 },
  },
];

/** Turns a preset into the shape the scenes play back. */
export function demoResultFor(preset) {
  return {
    message: preset.message,
    simulated: true,
    llm: {
      text: preset.llm.text,
      structured: preset.llm.structured,
      parseFailed: false,
      ms: VIDEO_TIMINGS.llmMs,
      cost: null,
    },
    jev: { answers: preset.jev, ms: VIDEO_TIMINGS.jevMs, cost: null },
  };
}
