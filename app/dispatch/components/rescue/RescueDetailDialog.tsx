"use client";

import { FiLoader, FiX } from "react-icons/fi";
import { RESCUE_ISSUE_OPTIONS } from "@/components/rescue/rescue-constants";
import { useToast } from "@/components/toast/useToast";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useDispatchRescueDetail } from "@/hooks/rescue-inbox";
import { RescueAssignSection } from "./RescueAssignSection";
import { RescueCancelSection } from "./RescueCancelSection";

type RescueDetailDialogProps = {
  requestId: string;
  onClose: () => void;
};

function issueLabel(issueType: string | null): string {
  return (
    RESCUE_ISSUE_OPTIONS.find((o) => o.value === issueType)?.label ??
    "Cứu hộ khẩn cấp"
  );
}

// Dispatcher override dialog: rescue facts, timeline, and the three
// manual actions (hand-assign, cancel, force-expire). The action panels
// live in sibling files so this shell stays under the line limit.
export function RescueDetailDialog({
  requestId,
  onClose,
}: RescueDetailDialogProps) {
  const toast = useToast();
  const detail = useDispatchRescueDetail(requestId);
  const rescue = detail.data?.rescue ?? null;
  const version = rescue?.updatedAt ?? null;

  function onDone(title: string) {
    toast.success(title, "Bảng cứu hộ sẽ tự làm mới.");
  }

  function onFail() {
    toast.error(
      "Thao tác thất bại",
      "Ca có thể vừa đổi trạng thái. Đang tải lại.",
    );
    void detail.refetch();
  }

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
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Mã {requestId.slice(0, 8)}… · Trạng thái: {rescue?.status ?? "…"}
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
                <dt className="text-[11px] text-zinc-500">Khách</dt>
                <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {rescue.customerName} · {rescue.customerPhone}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-zinc-500">Biển số</dt>
                <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {rescue.vehiclePlate ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] text-zinc-500">Vị trí</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                  {rescue.address ?? "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] text-zinc-500">Thợ đang giao</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                  {rescue.assignedMechanicName ?? "Chưa có"}
                </dd>
              </div>
            </dl>

            <RescueAssignSection
              requestId={requestId}
              rescue={rescue}
              version={version}
              onDone={onDone}
              onFail={onFail}
            />
            <RescueCancelSection
              requestId={requestId}
              status={rescue.status}
              version={version}
              onDone={onDone}
              onFail={onFail}
              onClose={onClose}
            />

            {detail.data && detail.data.timeline.length > 0 && (
              <ol className="flex flex-col gap-1.5 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                {detail.data.timeline.slice(0, 6).map((item) => (
                  <li
                    key={`${item.changedAt}-${item.newStatus}`}
                    className="text-[11px] text-zinc-500 dark:text-zinc-400"
                  >
                    {item.oldStatus ?? "—"} → {item.newStatus}
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
