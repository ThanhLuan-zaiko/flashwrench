"use client";

import dynamic from "next/dynamic";

// Client-only boundary (same pattern as LazyChatFab): the banner owns a
// realtime subscription and session query, so it ships as a separate chunk
// and renders nothing for guests/staff.
const Banner = dynamic(
  () =>
    import("@/components/payments/PaymentPromptBanner").then(
      (module) => module.PaymentPromptBanner,
    ),
  { ssr: false },
);

export function LazyPaymentPromptBanner() {
  return <Banner />;
}
