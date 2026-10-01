"use client";

import { useState } from "react";
import { FiLoader, FiX } from "react-icons/fi";
import { useRequestOrderReturn } from "@/hooks/orders";
import { RETURN_IMAGE_MAX, RETURN_REASON_MAX } from "@/lib/orders/order-return";
import type { OrderFieldErrors } from "@/lib/orders/orders.types";
import { AuthApiError } from "@/services/auth.api";
import { MediaApiError, uploadMediaRequest } from "@/services/media.api";
import { ReturnPhotoPicker } from "./ReturnPhotoPicker";

type OrderReturnDialogProps = {
  orderId: string;
  onClose: () => void;
  onError: (message: string) => void;
};

// Return/refund request dialog: a reason plus at least one photo of the
// received goods. Photos upload to /api/media (scope "return") on submit,
// then the order PATCH files the request with the collected URLs.
export function OrderReturnDialog({
  orderId,
  onClose,
  onError,
}: OrderReturnDialogProps) {
  const requestReturn = useRequestOrderReturn();
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<OrderFieldErrors>({});

  const busy = uploading || requestReturn.isPending;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...list].slice(0, RETURN_IMAGE_MAX - files.length);
    setFiles((prev) => [...prev, ...next]);
    setPreviews((prev) => [
      ...prev,
      ...next.map((file) => URL.createObjectURL(file)),
    ]);
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const removeAt = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    setErrors({});
    const trimmed = reason.trim();
    const local: OrderFieldErrors = {};
    if (!trimmed) local.reason = "Nhập lý do đổi trả / hoàn tiền.";
    if (files.length === 0) {
      local.images = "Đính kèm ít nhất 1 ảnh hiện trạng sản phẩm.";
    }
    if (local.reason || local.images) {
      setErrors(local);
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const { asset } = await uploadMediaRequest({
          file,
          scope: "return",
          ownerType: "order",
          ownerId: orderId,
          alt: `Ảnh đổi trả đơn ${orderId.slice(0, 8)}`,
        });
        urls.push(asset.url);
      }
      requestReturn.mutate(
        { orderId, reason: trimmed, images: urls },
        {
          onSuccess: () => onClose(),
          onError: (err) => {
            setUploading(false);
            if (err instanceof AuthApiError) {
              const field = err.errors as OrderFieldErrors;
              setErrors(field);
              if (!field.reason && !field.images && field.form) {
                onError(field.form);
                onClose();
              }
            } else {
              onError(err.message || "Không gửi được yêu cầu đổi trả.");
              onClose();
            }
          },
        },
      );
    } catch (err) {
      setUploading(false);
      setErrors({
        images:
          err instanceof MediaApiError
            ? (err.errors.file ?? err.errors.form ?? "Tải ảnh lên thất bại.")
            : "Tải ảnh lên thất bại. Thử lại sau.",
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Yêu cầu đổi trả / hoàn tiền"
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng yêu cầu đổi trả"
        onClick={onClose}
        disabled={busy}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-5 sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Đổi trả / hoàn tiền
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Trong 3 ngày kể từ khi nhận hàng, sản phẩm phải còn nguyên hiện
              vật.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng yêu cầu đổi trả"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <label
          htmlFor="return-reason"
          className="mt-4 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          Lý do đổi trả
        </label>
        <textarea
          id="return-reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setErrors((prev) => ({ ...prev, reason: undefined }));
          }}
          maxLength={RETURN_REASON_MAX}
          rows={3}
          placeholder="Ví dụ: bùgi bị móp đầu, sai mã so với xe…"
          className="mt-1.5 w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        {errors.reason && (
          <p
            role="alert"
            className="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {errors.reason}
          </p>
        )}

        <div className="mt-4">
          <ReturnPhotoPicker
            previews={previews}
            count={files.length}
            disabled={busy}
            error={errors.images}
            onAdd={addFiles}
            onRemove={removeAt}
          />
        </div>
        {errors.form && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {errors.form}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {busy && (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            )}
            {uploading ? "Đang tải ảnh…" : "Gửi yêu cầu"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
