"use client";

import { useState } from "react";
import {
  FiChevronDown,
  FiFlag,
  FiLoader,
  FiMessageSquare,
  FiRefreshCw,
} from "react-icons/fi";
import { CommentSection } from "@/components/feedback/CommentSection";
import { ComplaintFormDialog } from "@/components/feedback/ComplaintFormDialog";
import { useMyComplaints } from "@/hooks/complaints";
import { formatDateTime } from "@/lib/datetime/format";
import type { ComplaintItem, ComplaintStatus } from "@/services/complaints.api";

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: "Chờ tiếp nhận",
  in_review: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Đã từ chối",
};

const REF_LABELS: Record<string, string> = {
  booking: "Đơn sửa xe",
  emergency: "Cứu hộ khẩn cấp",
  order: "Đơn mua hàng",
  account: "Tài khoản",
  other: "Khác",
};

// "Khiếu nại" tab under /history: the customer's own reports with live
// status, an expandable discussion thread and the new-complaint dialog.
export function MyComplaintsPanel() {
  const query = useMyComplaints();
  const [composeOpen, setComposeOpen] = useState(false);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const items = query.data?.complaints ?? [];

  return (
    <section aria-label="Khiếu nại của tôi" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Theo dõi các khiếu nại bạn đã gửi và trao đổi với đội ngũ.
        </p>
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <FiFlag aria-hidden="true" className="h-4 w-4" />
          Gửi khiếu nại mới
        </button>
      </div>

      {query.isPending && (
        <p
          aria-busy="true"
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
        >
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
          Đang tải khiếu nại…
        </p>
      )}
      {query.isError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          Không tải được khiếu nại.
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-3 font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      )}

      {query.isSuccess && items.length === 0 && (
        <p className="rounded-2xl border border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Bạn chưa gửi khiếu nại nào.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const open = openThreadId === item.id;
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {item.subject}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {REF_LABELS[item.refType] ?? "Khác"} ·{" "}
                    {item.createdAt ? formatDateTime(item.createdAt) : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-zinc-300 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
              <p className="mt-2 text-xs whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                {item.body}
              </p>
              {item.resolutionNote && (
                <p className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                  Kết quả: {item.resolutionNote}
                </p>
              )}
              <button
                type="button"
                onClick={() => setOpenThreadId(open ? null : item.id)}
                aria-expanded={open}
                className="mt-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <FiMessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
                Trao đổi với đội ngũ
                <FiChevronDown
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open && (
                <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <CommentSection
                    targetType="complaint"
                    targetId={item.id}
                    title="Trao đổi"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {composeOpen && (
        <ComplaintFormDialog
          target={{ refType: "other" }}
          onClose={() => setComposeOpen(false)}
        />
      )}
    </section>
  );
}

export type { ComplaintItem };
