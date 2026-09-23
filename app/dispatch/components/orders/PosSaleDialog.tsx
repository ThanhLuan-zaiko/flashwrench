"use client";

import { useId, useState } from "react";
import { FiLoader, FiX } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { FormAlert } from "@/components/auth/FormAlert";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import {
  useCreateCounterSale,
  useDispatchParts,
} from "@/hooks/dispatch-orders";
import type { OrderFieldErrors } from "@/lib/orders/orders.types";
import { AuthApiError } from "@/services/auth.api";
import { PosSaleLines, type SaleLine } from "./PosSaleLines";

type PosSaleDialogProps = {
  onClose: () => void;
  onToast: (
    variant: "success" | "error",
    title: string,
    description?: string,
  ) => void;
};

// Walk-in counter sale: staff picks in-stock parts, the customer pays at
// the counter and leaves with the goods — the order lands directly in
// the delivered column, paid.
export function PosSaleDialog({ onClose, onToast }: PosSaleDialogProps) {
  const fieldId = useId();
  const parts = useDispatchParts();
  const sale = useCreateCounterSale();
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [partId, setPartId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<OrderFieldErrors>({});
  const nextKey = lines.reduce((max, line) => Math.max(max, line.key), 0) + 1;

  const partRows = parts.data?.parts ?? [];
  const partById = new Map(partRows.map((part) => [part.id, part]));
  const total = lines.reduce(
    (sum, line) =>
      sum + (partById.get(line.partId)?.price ?? 0) * line.quantity,
    0,
  );

  const addLine = () => {
    const part = partById.get(partId);
    if (!part || quantity < 1) return;
    setLines((current) => {
      const existing = current.find((line) => line.partId === partId);
      if (existing) {
        return current.map((line) =>
          line.partId === partId
            ? { ...line, quantity: Math.min(99, line.quantity + quantity) }
            : line,
        );
      }
      return [...current, { key: nextKey, partId, quantity }];
    });
    setPartId("");
    setQuantity(1);
  };

  const submit = () => {
    setErrors({});
    sale.mutate(
      {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        note: note.trim() || undefined,
        lines: lines.map((line) => ({
          partId: line.partId,
          quantity: line.quantity,
        })),
      },
      {
        onSuccess: (data) => {
          onToast(
            "success",
            "Đã ghi đơn bán tại quầy",
            `Đơn #${data.order.id.slice(0, 8)} · ${formatVnd(data.order.total)}`,
          );
          onClose();
        },
        onError: (err) => {
          if (err instanceof AuthApiError) {
            setErrors(err.errors as OrderFieldErrors);
          } else {
            setErrors({ form: "Không tạo được đơn bán. Vui lòng thử lại." });
          }
        },
      },
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bán hàng tại quầy"
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng bán hàng tại quầy"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div
        className={`relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-zinc-800 dark:bg-zinc-950 ${SCROLLBAR_CLASSES}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Bán hàng tại quầy
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Khách mua trực tiếp tại xưởng — đơn ghi nhận đã giao và đã thu
              tiền.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bán hàng tại quầy"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {errors.form && <FormAlert message={errors.form} />}

          <PosSaleLines
            parts={partRows}
            lines={lines}
            partId={partId}
            quantity={quantity}
            disabled={sale.isPending}
            error={errors.lines}
            onPartChange={setPartId}
            onQuantityChange={setQuantity}
            onAdd={addLine}
            onRemove={(key) =>
              setLines((current) => current.filter((l) => l.key !== key))
            }
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              id={`${fieldId}-customer`}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Tên khách (không bắt buộc)"
              aria-label="Tên khách"
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <input
              id={`${fieldId}-phone`}
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Số điện thoại (không bắt buộc)"
              aria-label="Số điện thoại khách"
              inputMode="tel"
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ghi chú (không bắt buộc)"
            aria-label="Ghi chú đơn bán"
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />

          <div className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Tổng thu
            </span>
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatVnd(total)}
            </span>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={sale.isPending || lines.length === 0}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:pointer-events-none disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {sale.isPending && (
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
            )}
            Thu tiền &amp; ghi đơn
          </button>
        </div>
      </div>
    </div>
  );
}
