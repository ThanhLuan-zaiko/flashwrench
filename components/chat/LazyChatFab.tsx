"use client";

import dynamic from "next/dynamic";

// Client-only boundary for the chat launcher (same pattern as the account
// lock guard): realtime socket + panel ship as a separate chunk that loads
// after hydration, never blocking the static page shell.
const Fab = dynamic(
  () => import("@/components/chat/ChatFab").then((module) => module.ChatFab),
  { ssr: false },
);

export function LazyChatFab() {
  return <Fab />;
}
