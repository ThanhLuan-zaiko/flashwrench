// "Payment confirmation waiting" prompts: one row per outstanding cash
// collection a customer still has to confirm. Written when a collector
// issues the confirm code, deleted when the balance settles, and lazily
// re-verified against the live ref row on every read so a missed delete
// can never leave a stale banner.

export const PAYMENT_PROMPT_KINDS = ["booking", "emergency", "order"] as const;

export type PaymentPromptKind = (typeof PAYMENT_PROMPT_KINDS)[number];

export function isPaymentPromptKind(
  value: unknown,
): value is PaymentPromptKind {
  return (
    typeof value === "string" &&
    (PAYMENT_PROMPT_KINDS as readonly string[]).includes(value)
  );
}

/** Raw row of payment_prompts_by_customer. */
export type PaymentPromptRow = {
  customer_id: string;
  ref_type: string;
  ref_id: string;
  title: string | null;
  amount_due: number | null;
  issued_at: Date | null;
};

/** One banner line: where the customer opens the page holding the code. */
export type PaymentPromptItem = {
  kind: PaymentPromptKind;
  refId: string;
  title: string;
  amountDue: number;
  href: string;
  issuedAt: string | null;
};
