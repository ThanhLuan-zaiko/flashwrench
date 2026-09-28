"use client";

import { useState } from "react";
import { FiLoader, FiX } from "react-icons/fi";
import { useCreateMyComplaint } from "@/hooks/complaints";
import type { CustomerComplaintInput } from "@/services/complaints.api";
import { AuthApiError } from "@/services/complaints.api";

export type ComplaintTarget = {
  refType?: string;
  refId?: string;
  targetUserId?: string;
  targetName?: string;
  // Human-readable hint shown above the form, e.g. "Đơn hàng #abc123".
  refLabel?: string;
};

// Customer complaint dialog: prefilled ref context (booking/order/rescue)
// when opened from a detail surface, free-form when opened standalone.
export function ComplaintFormDialog({
  target,
  onClose,
  onSubmitted,
}: {
  target?: ComplaintTarget;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gửi khiếu nại"
      className="fixed inset-0 z-[60] flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/50"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Gửi khiếu nại
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <ComplaintFields
          key={`${target?.refType ?? "any"}:${target?.refId ?? "none"}`}
          target={target}
          onClose={onClose}
          onSubmitted={onSubmitted}
        />
      </div>
    </div>
  );
}

// The form body remounts via `key` whenever the ref target changes, so no
// reset effect is needed.
function ComplaintFields({
  target,
  onClose,
  onSubmitted,
}: {
  target?: ComplaintTarget;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const create = useCreateMyComplaint();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const payload: CustomerComplaintInput = {
      refType: target?.refType,
      refId: target?.refId,
      targetUserId: target?.targetUserId,
      targetName: target?.targetName,
      subject,
      body,
    };
    create.mutate(payload, {
      onSuccess: () => {
        onSubmitted?.();
        onClose();
      },
      onError: (error) => {
        if (error instanceof AuthApiError) {
          setErrors(error.errors as Record<string, string>);
        } else {
          setErrors({ form: "Không gửi được khiếu nại. Vui lòng thử lại." });
        }
      },
    });
  };

  const field = (name: string) =>
    errors[name] ? (
      <p
        role="alert"
        className="text-[11px] font-medium text-red-600 dark:text-red-400"
      >
        {errors[name]}
      </p>
    ) : null;

  return (
    <form
      className="flex flex-col gap-3 overflow-y-auto px-5 py-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {target?.refLabel && (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Liên quan đến: {target.refLabel}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Tiêu đề
        </span>
        <input
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={120}
          placeholder="Tóm tắt vấn đề"
          className="min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      {field("subject")}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Nội dung chi tiết
        </span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Mô tả rõ sự việc để đội ngũ xử lý nhanh hơn"
          className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      {field("body")}
      {field("refId")}
      {field("form")}

      <button
        type="submit"
        disabled={create.isPending}
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {create.isPending && (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        )}
        Gửi khiếu nại
      </button>
    </form>
  );
}
