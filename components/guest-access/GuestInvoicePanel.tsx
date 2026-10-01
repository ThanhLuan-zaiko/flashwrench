"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import type { GuestInvoice } from "@/lib/guest-access/guest-access.types";
import { DownloadInvoiceButton } from "./DownloadInvoiceButton";
import {
  formatVnd,
  paymentMethodLabel,
  paymentStatusLabel,
  recordStatusLabel,
} from "./guest-access-format";

type GuestInvoicePanelProps = {
  invoice: GuestInvoice;
  onClose: () => void;
};

const KIND_TITLES: Record<GuestInvoice["kind"], string> = {
  booking: "Hóa đơn dịch vụ sửa xe",
  rescue: "Hóa đơn cứu hộ khẩn cấp",
  order: "Hóa đơn linh kiện",
};

const KIND_LABELS: Record<GuestInvoice["kind"], string> = {
  booking: "Đặt lịch sửa xe",
  rescue: "Cứu hộ khẩn cấp",
  order: "Đơn linh kiện",
};

/**
 * Customer invoice for an anonymous record. The PDF itself is rendered
 * server-side (lib/pdf) because jsPDF's base fonts are WinAnsi-only and
 * Vietnamese diacritics need an embedded TrueType face.
 */
export function GuestInvoicePanel({
  invoice,
  onClose,
}: GuestInvoicePanelProps) {
  const { totals } = invoice;
  const [downloadError, setDownloadError] = useState<string | null>(null);
  return (
    <section
      aria-label={KIND_TITLES[invoice.kind]}
      className="flex flex-col gap-4"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {KIND_TITLES[invoice.kind]}
          </h2>
          <p className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {KIND_LABELS[invoice.kind]} · Mã {invoice.reference}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <DownloadInvoiceButton
            type={invoice.kind}
            id={invoice.id}
            onError={setDownloadError}
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:outline-none motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <FiX aria-hidden="true" className="h-4 w-4" />
            Đóng
          </button>
        </div>
      </header>

      {downloadError && (
        <p
          role="alert"
          className="print:hidden text-sm text-red-600 dark:text-red-400"
        >
          {downloadError}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <Field label="Khách hàng" value={invoice.customerName} />
        <Field label="Số điện thoại" value={invoice.customerPhone} />
        {invoice.vehicleLabel && (
          <Field label="Xe" value={invoice.vehicleLabel} />
        )}
        <Field label="Trạng thái" value={recordStatusLabel(invoice.status)} />
        <Field
          label="Thanh toán"
          value={paymentStatusLabel(invoice.paymentStatus)}
        />
        {invoice.mechanicName && (
          <Field label="Thợ phụ trách" value={invoice.mechanicName} />
        )}
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th scope="col" className="py-2 pr-3">
                Hạng mục
              </th>
              <th scope="col" className="py-2 px-3 text-right">
                SL
              </th>
              <th scope="col" className="py-2 px-3 text-right">
                Đơn giá
              </th>
              <th scope="col" className="py-2 pl-3 text-right">
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {invoice.lines.map((line) => (
              <tr key={line.id}>
                <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-200">
                  {line.name}
                </td>
                <td className="py-2 px-3 text-right text-zinc-600 dark:text-zinc-400">
                  {line.quantity}
                </td>
                <td className="py-2 px-3 text-right text-zinc-600 dark:text-zinc-400">
                  {formatVnd(line.unitPrice)}
                </td>
                <td className="py-2 pl-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {formatVnd(line.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto flex w-full max-w-xs flex-col gap-1.5 text-sm">
        <Row label="Tạm tính" value={formatVnd(totals.subtotal)} />
        {totals.extraFee > 0 && (
          <Row label="Phí phát sinh" value={formatVnd(totals.extraFee)} />
        )}
        {totals.discount > 0 && (
          <Row label="Giảm giá" value={`−${formatVnd(totals.discount)}`} />
        )}
        <Row label="Tổng cộng" value={formatVnd(totals.total)} strong />
        <Row label="Đã thanh toán" value={formatVnd(totals.paid)} />
        {totals.outstanding > 0 && (
          <Row
            label="Còn phải trả"
            value={formatVnd(totals.outstanding)}
            strong
          />
        )}
      </dl>

      {invoice.payments.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Lịch sử thanh toán
          </h3>
          <ul className="flex flex-col gap-1 text-sm">
            {invoice.payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-baseline justify-between gap-2"
              >
                <span className="text-zinc-700 dark:text-zinc-300">
                  {paymentMethodLabel(payment.method)}
                  {payment.paidAt ? ` · ${payment.paidAt}` : ""}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {formatVnd(payment.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {invoice.notes && (
        <p className="border-t border-zinc-200 pt-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          Ghi chú: {invoice.notes}
        </p>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="truncate font-medium text-zinc-900 dark:text-zinc-50">
        {value}
      </dd>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt
        className={
          strong
            ? "font-semibold text-zinc-900 dark:text-zinc-50"
            : "text-zinc-600 dark:text-zinc-400"
        }
      >
        {label}
      </dt>
      <dd
        className={
          strong
            ? "font-semibold text-zinc-900 dark:text-zinc-50"
            : "text-zinc-700 dark:text-zinc-300"
        }
      >
        {value}
      </dd>
    </div>
  );
}
