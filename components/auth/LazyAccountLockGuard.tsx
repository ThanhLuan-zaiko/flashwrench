"use client";

import dynamic from "next/dynamic";

// Client-only boundary for the lock guard. next/dynamic forbids
// `ssr: false` directly in Server Components, so the root layout renders
// this wrapper instead: the guard (realtime socket, session polling,
// overlay) ships as a separate chunk that loads right after hydration
// instead of blocking the static page shell.
const Guard = dynamic(
  () =>
    import("@/components/auth/AccountLockGuard").then(
      (module) => module.AccountLockGuard,
    ),
  { ssr: false },
);

export function LazyAccountLockGuard() {
  return <Guard />;
}
