"use client";

import { FiLoader, FiPhone, FiX } from "react-icons/fi";
import {
  RESCUE_HOTLINE,
  RESCUE_ISSUE_OPTIONS,
} from "@/components/rescue/rescue-constants";
import {
  rescueStatusBadgeClass,
  rescueStatusLabel,
} from "@/components/rescue/rescue-format";
import { PaymentCodeCard } from "@/components/revenue/PaymentCodeCard";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useMyRescueDetail } from "@/hooks/rescue";
import { formatDateTime } from "@/lib/datetime/format";

type HistoryRescueDialogProps = {
  requestId: string;
  onClose: () => void;
};

function issueLabel(issueType: string | null): string {
  return (
    RESCUE_ISSUE_OPTIONS.find((o) => o.value === issueType)?.label ??
    "Cứu hộ khẩn cấp"
  );
}

// Read-only rescue detail for the filing customer: facts, assigned
// mechanic and the status timeline. Dispatch actions stay staff-only.
export function HistoryRescueDialog({
  requestId,
  onClose,
}: HistoryRescueDialogProps) {
  const detail = useMyRescueDetail(requestId);
  const rescue = detail.data?.rescue ?? null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết cứu hộ"
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng chi tiết cứu hộ"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div
        className={`relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-zinc-800 dark:bg-zinc-950 ${SCROLLBAR_CLASSES}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {rescue ? issueLabel(rescue.issueType) : "Chi tiết cứu hộ"}
            </h2>
            <p className="mt-1">
              <span className={rescueStatusBadgeClass(rescue?.status ?? null)}>
                {rescueStatusLabel(rescue?.status ?? null)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {detail.isPending ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500">
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
            Đang tải…
          </p>
        ) : !rescue ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Không tải được. Vui lòng thử lại.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <dl className="grid grid-cols-1 gap-2 rounded-xl bg-zinc-100 p-3 text-sm sm:grid-cols-2 dark:bg-zinc-900">
              <div>
                <dt className="text-[11px] text-zinc-500">Biển số</dt>
                <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {rescue.vehiclePlate ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-zinc-500">Thợ phụ trách</dt>
                <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {rescue.assignedMechanicName ?? "Đang tìm thợ…"}
                </dd>
              </div>
              {rescue.status === "en_route" && rescue.etaMin !== null && (
                <div>
                  <dt className="text-[11px] text-zinc-500">
                    Thời gian tới dự kiến
                  </dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                    ~{rescue.etaMin} phút
                  </dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-[11px] text-zinc-500">Vị trí xe</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                  {rescue.address ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] text-zinc-500">Cập nhật</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                  {formatDateTime(rescue.updatedAt)}
                </dd>
              </div>
            </dl>

            {rescue.paymentConfirmCode && (
              <PaymentCodeCard code={rescue.paymentConfirmCode} />
            )}

            {rescue.paymentStatus !== "paid" && rescue.finalPrice !== null && (
              <p className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                <span className="text-zinc-600 dark:text-zinc-300">
                  Số tiền cần thanh toán
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {new Intl.NumberFormat("vi-VN").format(rescue.finalPrice)}đ
                </span>
              </p>
            )}

            <a
              href={`tel:${RESCUE_HOTLINE.replace(/\s/g, "")}`}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <FiPhone aria-hidden="true" className="h-4 w-4" />
              Gọi hotline {RESCUE_HOTLINE}
            </a>

            {detail.data && detail.data.timeline.length > 0 && (
              <ol className="flex flex-col gap-1.5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                {detail.data.timeline.slice(0, 8).map((item) => (
                  <li
                    key={`${item.changedAt}-${item.newStatus}`}
                    className="text-[11px] text-zinc-500 dark:text-zinc-400"
                  >
                    {formatDateTime(item.changedAt)} ·{" "}
                    {item.oldStatus
                      ? `${rescueStatusLabel(item.oldStatus)} → `
                      : ""}
                    {rescueStatusLabel(item.newStatus)}
                    {item.note ? ` · ${item.note}` : ""}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
