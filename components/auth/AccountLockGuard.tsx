"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiLock } from "react-icons/fi";
import { useToast } from "@/components/toast/useToast";
import { authKeys, useAccountSession } from "@/hooks/auth";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { useRealtimeTopic } from "@/hooks/useRealtimeTopic";
import {
  type AccountBlockReason,
  accountBlockNotice,
  accountLockedLoginHref,
  parseAccountLockEvent,
  toBlockReason,
} from "@/lib/auth/account-status";
import { userTopic } from "@/lib/realtime/protocol";
import { logoutRequest } from "@/services/auth.api";

// The server half of a lock already happened when the admin pressed the
// button: token_version bumped and every refresh family deleted. This guard
// is the browser half, and it listens to two independent triggers so a
// forced logout cannot be missed:
//   1. the realtime `user:{id}` notice -> instant while the socket is up;
//   2. `/api/auth/me` (polled, on window focus, and once per reconnection)
//      -> covers a lock published while this browser had no socket.
const LOCK_POLL_MS = 60 * 1000;

// The guard lives in the root layout, so it must step aside on the pages it
// sends the account to: there the login notice takes over.
const AUTH_PATHS = ["/login", "/register"];

export function AccountLockGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const realtime = useRealtimeStatus();
  const session = useAccountSession({
    // Polling only matters while this browser believes it still has a
    // session: it catches a lock published while the socket was down.
    // Anonymous visitors stop polling as soon as the first answer lands.
    refetchInterval: (query) => {
      const data = query.state.data;
      const idle =
        data !== undefined && data.user === null && data.status === "active";
      return idle ? false : LOCK_POLL_MS;
    },
    refetchOnWindowFocus: true,
  });
  const { refetch } = session;
  const [block, setBlock] = useState<AccountBlockReason | null>(null);
  const enforced = useRef(false);
  const wasLive = useRef(false);

  const user = session.data?.user ?? null;
  const status = session.data?.status ?? "active";

  const enforce = useCallback(
    (reason: AccountBlockReason) => {
      setBlock(reason);
      if (enforced.current) return;
      enforced.current = true;
      const notice = accountBlockNotice(reason);
      toast.error(notice.title, notice.description);
      // The session is already dead server-side; this only drops the cookies
      // and the cached user of this browser so the header stops showing it.
      void logoutRequest()
        .catch(() => undefined)
        .finally(() => {
          void queryClient.invalidateQueries({ queryKey: authKeys.all });
        });
    },
    [queryClient, toast],
  );

  useEffect(() => {
    const reason = toBlockReason(status);
    if (reason) enforce(reason);
  }, [status, enforce]);

  // Signing in again must clear the overlay, otherwise the account would
  // stay stuck behind it after the admin unlocks it.
  useEffect(() => {
    if (!user) return;
    enforced.current = false;
    setBlock(null);
  }, [user]);

  // The first connect already fetched, so revalidate only on a reconnect:
  // the lock notice may have been published while this browser was offline.
  useEffect(() => {
    if (realtime !== "live") return;
    if (wasLive.current) void refetch();
    wasLive.current = true;
  }, [realtime, refetch]);

  useRealtimeTopic(user ? userTopic(user.id) : "", {
    enabled: user !== null,
    onEvent: (payload) => {
      const reason = parseAccountLockEvent(payload);
      if (reason) enforce(reason);
    },
  });

  const onAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));
  if (block === null || onAuthPath) return null;

  const notice = accountBlockNotice(block);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={notice.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div aria-hidden="true" className="fixed inset-0 bg-zinc-950/50" />
      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <FiLock aria-hidden="true" className="h-6 w-6" />
        </span>
        <p className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">
          {notice.title}
        </p>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">
          {notice.description}
        </p>
        <button
          type="button"
          onClick={() => router.push(accountLockedLoginHref())}
          className="mt-5 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Về trang đăng nhập
        </button>
      </div>
    </div>
  );
}
