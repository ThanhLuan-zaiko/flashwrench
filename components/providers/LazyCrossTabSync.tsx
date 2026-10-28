"use client";

import dynamic from "next/dynamic";

// Client-only boundary for the same-browser tab sync (same pattern as the
// chat launcher): the listener reaches the booking, order and rescue hooks,
// which carry the realtime client, so it ships as a separate chunk that
// loads after hydration instead of joining the first paint.
const Sync = dynamic(
  () =>
    import("@/components/providers/CrossTabSync").then(
      (module) => module.CrossTabSync,
    ),
  { ssr: false },
);

export function LazyCrossTabSync() {
  return <Sync />;
}
