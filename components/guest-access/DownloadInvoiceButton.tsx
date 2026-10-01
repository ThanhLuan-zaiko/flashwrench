"use client";

import { useState } from "react";
import { FiDownload } from "react-icons/fi";
import type { GuestRecordType } from "@/lib/guest-access/guest-access.types";

type DownloadInvoiceButtonProps = {
  type: GuestRecordType;
  id: string;
  onError: (message: string) => void;
};

/**
 * Downloads the PDF through fetch rather than a plain anchor so an expired
 * lookup session or a 404 surfaces as a message instead of silently
 * downloading a JSON error body named `.pdf`.
 */
export function DownloadInvoiceButton({
  type,
  id,
  onError,
}: DownloadInvoiceButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(
        `/api/guest-access/invoice.pdf?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
      );
      if (!response.ok) {
        let message = "Không tải được hóa đơn. Vui lòng thử lại.";
        try {
          const body: unknown = await response.json();
          if (typeof body === "object" && body !== null) {
            const errors = (body as { errors?: { form?: string } }).errors;
            if (errors?.form) message = errors.form;
          }
        } catch {
          // Non-JSON error body: keep the generic message.
        }
        onError(message);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filenameFromDisposition(
        response.headers.get("Content-Disposition"),
        type,
      );
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Revoking immediately can cancel the download in some browsers; one
      // tick of delay is enough for the click to be handled.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      onError("Không tải được hóa đơn. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Tải hóa đơn dạng PDF"
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950 print:hidden"
    >
      <FiDownload aria-hidden="true" className="h-4 w-4" />
      {pending ? "Đang tạo PDF…" : "Tải PDF"}
    </button>
  );
}

/** The server already names the file; fall back only if the header is lost. */
function filenameFromDisposition(
  header: string | null,
  type: GuestRecordType,
): string {
  const match = /filename="([^"]+)"/.exec(header ?? "");
  if (match) return match[1];
  return type === "order" ? "hoa-don-don-linh-kien.pdf" : `hoa-don-${type}.pdf`;
}
