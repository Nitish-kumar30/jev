/**
 * 50 short customer messages with a hidden correct label.
 *
 * `ambiguous: true` marks messages that genuinely sit between two labels
 * (e.g. a billing problem and a crash in the same sentence) — these are the
 * ones where a confidence score earns its keep.
 * `tricky: true` marks spam that is written to look legitimate, or real
 * messages that read like spam.
 */

export const LABELS = ['Billing', 'Technical', 'Refund', 'Spam'];
export const HUMAN_REVIEW = 'Human review';

export const LABEL_STYLES = {
  Billing: { color: 'var(--color-billing)', short: 'BIL' },
  Technical: { color: 'var(--color-technical)', short: 'TEC' },
  Refund: { color: 'var(--color-refund)', short: 'REF' },
  Spam: { color: 'var(--color-spam)', short: 'SPM' },
  [HUMAN_REVIEW]: { color: 'var(--color-human)', short: 'HUM' },
};

export const TICKETS = [
  { id: 1, text: 'My card was charged twice for the same month, can you check?', label: 'Billing' },
  { id: 2, text: 'The app crashes every time I open the reports page.', label: 'Technical' },
  { id: 3, text: 'I want my money back for the annual plan I bought yesterday.', label: 'Refund' },
  { id: 4, text: 'CONGRATULATIONS! You have won a $1,000 gift card. Claim now!!!', label: 'Spam' },
  { id: 5, text: 'Why does my invoice say $79 when the pricing page says $49?', label: 'Billing' },
  { id: 6, text: 'Login page keeps saying "session expired" in a loop.', label: 'Technical' },
  { id: 7, text: 'Charged twice and the app crashed during checkout — sort this out.', label: 'Billing', ambiguous: true },
  { id: 8, text: 'Please cancel my subscription and refund this month.', label: 'Refund' },
  { id: 9, text: 'Hi, I represent a marketing agency and would love to partner with you.', label: 'Spam', tricky: true },
  { id: 10, text: 'Export to CSV downloads an empty file every time.', label: 'Technical' },
  { id: 11, text: 'You billed me after I cancelled in March. I want that reversed.', label: 'Refund', ambiguous: true },
  { id: 12, text: 'Can I switch from monthly to annual billing mid-cycle?', label: 'Billing' },
  { id: 13, text: 'Two-factor codes never arrive on my phone.', label: 'Technical' },
  { id: 14, text: 'URGENT: your account will be suspended, verify your password here.', label: 'Spam' },
  { id: 15, text: 'The dashboard is blank on Safari but fine on Chrome.', label: 'Technical' },
  { id: 16, text: 'I was charged in USD but my card is in EUR, the conversion looks wrong.', label: 'Billing' },
  { id: 17, text: 'Product was not what I expected, how do I return it?', label: 'Refund' },
  { id: 18, text: 'Buy cheap followers, instant delivery, best price on the market.', label: 'Spam' },
  { id: 19, text: 'Our invoice needs our VAT number on it before finance will pay.', label: 'Billing' },
  { id: 20, text: 'API returns 500 on every POST to /v1/events since this morning.', label: 'Technical' },
  { id: 21, text: 'Paid for the upgrade, never got the features, so I want a refund.', label: 'Refund', ambiguous: true },
  { id: 22, text: 'Do you offer a discount for non-profits?', label: 'Billing' },
  { id: 23, text: 'Password reset email lands in spam every single time.', label: 'Technical', tricky: true },
  { id: 24, text: 'Dear friend, I have a business proposal worth $4.5 million for you.', label: 'Spam' },
  { id: 25, text: 'Double charge on 14 March, and support chat froze when I reported it.', label: 'Billing', ambiguous: true },
  { id: 26, text: 'The mobile app logs me out every few minutes.', label: 'Technical' },
  { id: 27, text: 'Refund the shipping fee, the parcel arrived two weeks late.', label: 'Refund' },
  { id: 28, text: 'Your receipt looks wrong — it lists 5 seats, we only have 3.', label: 'Billing' },
  { id: 29, text: 'Click here to claim your unclaimed refund of $312.44 immediately.', label: 'Spam', tricky: true },
  { id: 30, text: 'Webhooks stopped firing after the last deploy.', label: 'Technical' },
  { id: 31, text: 'I need a copy of every invoice from last financial year.', label: 'Billing' },
  { id: 32, text: 'Charge me once, not weekly — and give back the extra three payments.', label: 'Refund', ambiguous: true },
  { id: 33, text: 'Search results take 30 seconds to load on large accounts.', label: 'Technical' },
  { id: 34, text: 'Make $5,000 a week from home, no experience needed. Reply YES.', label: 'Spam' },
  { id: 35, text: 'Can you move our renewal date to the start of the quarter?', label: 'Billing' },
  { id: 36, text: 'File upload fails for anything over 10 MB with no error shown.', label: 'Technical' },
  { id: 37, text: 'Cancelled the trial but you still took the full amount. Please return it.', label: 'Refund' },
  { id: 38, text: 'Are you interested in a guest post with a do-follow backlink?', label: 'Spam', tricky: true },
  { id: 39, text: 'My credit card expired, where do I update payment details?', label: 'Billing' },
  { id: 40, text: 'Dark mode makes half the buttons invisible.', label: 'Technical' },
  { id: 41, text: 'The plan renewed automatically and I did not want it — refund please.', label: 'Refund' },
  { id: 42, text: 'Invoice #4821 is marked unpaid but my bank shows it cleared.', label: 'Billing', ambiguous: true },
  { id: 43, text: 'Notifications arrive hours late, sometimes not at all.', label: 'Technical' },
  { id: 44, text: 'Your CEO asked me to contact you about an urgent wire transfer.', label: 'Spam' },
  { id: 45, text: 'We were billed for 12 months but only used 4. Can we get the rest back?', label: 'Refund' },
  { id: 46, text: 'Sync with Google Calendar duplicates every event.', label: 'Technical' },
  { id: 47, text: 'Add a purchase order number to our next invoice, please.', label: 'Billing' },
  { id: 48, text: 'Limited time offer: 90% off SEO services, act within 24 hours!', label: 'Spam' },
  { id: 49, text: 'Charged for a seat we removed, and the seat still shows in the admin panel.', label: 'Billing', ambiguous: true },
  { id: 50, text: 'The refund you issued never reached my account after 10 days.', label: 'Refund', tricky: true },
];

export const AMBIGUOUS_COUNT = TICKETS.filter((t) => t.ambiguous).length;
