"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiLink } from "react-icons/fi";

// Copy-link button for a public campaign detail: guests share the live
// promotion URL. Feedback resets after a short delay; clipboard failures
// show a hint instead of failing silently.
export function CampaignShareButton({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    const url = `${window.location.origin}/vouchers/c/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-live="polite"
      aria-label={
        state === "copied" ? "Đã sao chép liên kết" : "Sao chép liên kết ưu đãi"
      }
      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-center text-sm font-semibold text-zinc-800 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
    >
      {state === "copied" ? (
        <FiCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
      ) : (
        <FiLink aria-hidden="true" className="h-4 w-4 shrink-0" />
      )}
      {state === "copied"
        ? "Đã sao chép"
        : state === "failed"
          ? "Không sao chép được"
          : "Chia sẻ ưu đãi"}
    </button>
  );
}
