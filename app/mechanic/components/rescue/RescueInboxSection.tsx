"use client";

import { FiLifeBuoy } from "react-icons/fi";
import { useMechanicRescues } from "@/hooks/rescue-inbox";
import { RescueInboxCard } from "./RescueInboxCard";

// Rescue inbox pinned above the schedule queue: 30s offers appear here
// the instant auto-dispatch assigns them, with countdown plus accept and
// decline actions on each card.
export function RescueInboxSection() {
  const inbox = useMechanicRescues();
  const items = inbox.data?.items ?? [];

  if (inbox.isPending) return null;
  if (inbox.isError || items.length === 0) return null;

  return (
    <section
      aria-label="Cứu hộ được giao"
      data-tour="mech-rescue-inbox"
      className="flex flex-col gap-3"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        <FiLifeBuoy aria-hidden="true" className="h-4 w-4" />
        Cứu hộ cần bạn ({items.length})
      </p>
      {items.map((rescue) => (
        <RescueInboxCard key={rescue.requestId} rescue={rescue} />
      ))}
    </section>
  );
}
