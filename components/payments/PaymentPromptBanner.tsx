"use client";

import Link from "next/link";
import { FiChevronRight, FiKey } from "react-icons/fi";
import { useMe } from "@/hooks/auth";
import {
  usePaymentPrompts,
  usePaymentPromptsRealtime,
} from "@/hooks/usePaymentPrompts";
import { formatVnd } from "@/lib/guest-access/guest-access.format";

// Sticky strip pinned under the 64px site header: one row per outstanding
// cash collection the customer still has to confirm. It follows them across
// the whole site — the mechanic is waiting at the door, not on /history.
export function PaymentPromptBanner() {
  const me = useMe();
  const isCustomer = me.data?.role === "customer";
  const { data: prompts } = usePaymentPrompts();
  usePaymentPromptsRealtime(isCustomer ? prompts : undefined);
  if (!isCustomer || !prompts || prompts.length === 0) return null;
  return (
    <div className="sticky top-16 z-40 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <ul className="mx-auto max-w-7xl divide-y divide-zinc-200 px-4 sm:px-6 lg:px-8 dark:divide-zinc-800">
        {prompts.map((prompt) => (
          <li key={`${prompt.kind}:${prompt.refId}`}>
            <Link
              href={prompt.href}
              className="flex min-h-11 items-center gap-3 py-2 text-sm transition-colors duration-200 hover:text-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:text-zinc-50"
            >
              <FiKey
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400"
              />
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">
                {prompt.title}
                <span className="font-normal text-zinc-500 dark:text-zinc-400">
                  {" "}
                  đang chờ thanh toán · {formatVnd(prompt.amountDue)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Xem mã xác nhận
                <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
