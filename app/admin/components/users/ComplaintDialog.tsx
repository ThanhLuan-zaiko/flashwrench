"use client";

import { useState } from "react";
import { FiLoader, FiSave, FiX } from "react-icons/fi";
import { useCreateComplaint, useTransitionComplaint } from "@/hooks/complaints";
import type {
  ComplaintAction,
  ComplaintItem,
  ComplaintRefType,
} from "@/lib/complaints/complaint.types";
import { AuthApiError } from "@/services/complaints.api";
import { fieldError } from "../services/catalog-errors";
import { ComplaintCreateFields } from "./ComplaintCreateFields";
import { COMPLAINT_STATUS_LABELS } from "./complaint-format";

export type ComplaintDialogState =
  | { mode: "create" }
  | { mode: "handle"; item: ComplaintItem };

type ComplaintDialogProps = {
  dialog: ComplaintDialogState | null;
  onClose: () => void;
};

const LABEL =
  "flex flex-col gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300";

// Create form for recording a report plus the handling panel for one
// complaint. Parent passes a keyed instance so state resets per open.
export function ComplaintDialog({ dialog, onClose }: ComplaintDialogProps) {
  const handling = dialog?.mode === "handle" ? dialog.item : null;
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [targetName, setTargetName] = useState("");
  const [refType, setRefType] = useState<ComplaintRefType>("other");
  const [refId, setRefId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");

  const createMutation = useCreateComplaint();
  const transitionMutation = useTransitionComplaint();
  const pending = createMutation.isPending || transitionMutation.isPending;
  const error = createMutation.error ?? transitionMutation.error ?? null;

  if (!dialog) return null;

  const submitCreate = () => {
    createMutation.mutate(
      {
        reporterName: reporterName.trim(),
        reporterPhone: reporterPhone.trim() || undefined,
        targetName: targetName.trim() || undefined,
        refType,
        refId: refId.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
      },
      { onSuccess: onClose },
    );
  };

  const runTransition = (action: ComplaintAction) => {
    if (!handling) return;
    transitionMutation.mutate(
      { id: handling.id, action, note: note.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={handling ? "Xử lý khiếu nại" : "Ghi nhận khiếu nại"}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {handling ? "Xử lý khiếu nại" : "Ghi nhận khiếu nại"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {handling
                ? `${COMPLAINT_STATUS_LABELS[handling.status]} · ${handling.reporterName}`
                : "Ghi lại phản ánh từ khách hàng để theo dõi xử lý."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {handling ? (
          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-xl bg-zinc-100 px-3 py-2.5 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {handling.subject}
              </p>
              <p className="mt-1 text-xs whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
                {handling.body}
              </p>
              {handling.resolutionNote && (
                <p className="mt-2 border-t border-zinc-200 pt-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  Đã xử lý: {handling.resolutionNote}
                </p>
              )}
            </div>
            <label className={LABEL}>
              Ghi chú xử lý (bắt buộc khi giải quyết hoặc từ chối)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Kết quả xác minh, hướng khắc phục…"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              {fieldError(error, "note") && (
                <span className="font-medium text-red-600 dark:text-red-400">
                  {fieldError(error, "note")}
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {handling.status === "open" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runTransition("start-review")}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Bắt đầu xử lý
                </button>
              )}
              {(handling.status === "open" ||
                handling.status === "in_review") && (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => runTransition("resolve")}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {pending ? "Đang lưu…" : "Giải quyết"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => runTransition("reject")}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Từ chối
                  </button>
                </>
              )}
              {(handling.status === "resolved" ||
                handling.status === "rejected") && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runTransition("reopen")}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {pending ? "Đang lưu…" : "Mở lại"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <ComplaintCreateFields
            reporterName={reporterName}
            reporterPhone={reporterPhone}
            targetName={targetName}
            refType={refType}
            refId={refId}
            subject={subject}
            body={body}
            error={error}
            onReporterName={setReporterName}
            onReporterPhone={setReporterPhone}
            onTargetName={setTargetName}
            onRefType={setRefType}
            onRefId={setRefId}
            onSubject={setSubject}
            onBody={setBody}
          />
        )}

        {error instanceof AuthApiError && error.errors.form && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error.errors.form}
          </p>
        )}

        {!handling && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={submitCreate}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {pending ? (
                <FiLoader
                  aria-hidden="true"
                  className="h-4 w-4 motion-safe:animate-spin"
                />
              ) : (
                <FiSave aria-hidden="true" className="h-4 w-4" />
              )}
              {pending ? "Đang lưu…" : "Ghi nhận"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
