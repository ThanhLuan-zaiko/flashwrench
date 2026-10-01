"use client";

import { FiAlertCircle, FiFileText, FiLoader, FiX } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import {
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/components/orders/order-format";
import { SCROLLBAR_CLASSES } from "@/components/ui/scrollbar";
import { useDispatchOrderInvoice } from "@/hooks/dispatch-orders";
import { formatDateTime } from "@/lib/datetime/format";

type OrderInvoiceDialogProps = {
  orderId: string;
  onClose: () => void;
};

// Staff-facing invoice (dispatcher + admin): a receipt-style read of the
// order — customer, line items, totals — plus the payment receipt block
// (method, status, MOCK-*/provider ref, settled time).
export function OrderInvoiceDialog({
  orderId,
  onClose,
}: OrderInvoiceDialogProps) {
  const query = useDispatchOrderInvoice(orderId);
  const invoice = query.data?.invoice ?? null;
  const order = invoice?.order ?? null;
  const payment = invoice?.payment ?? null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hóa đơn linh kiện"
      className="fixed inset-0 z-50 flex h-dvh items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Đóng hóa đơn"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/50"
      />
      <div
        className={`relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-4 sm:rounded-2xl sm:p-5 dark:border-zinc-800 dark:bg-zinc-950 ${SCROLLBAR_CLASSES}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <FiFileText aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Hóa đơn bán linh kiện
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                FlashWrench · Xưởng sửa xe lưu động
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hóa đơn"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {query.isPending && (
          <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
            <FiLoader
              aria-hidden="true"
              className="h-4 w-4 motion-safe:animate-spin"
            />
            Đang tải hóa đơn…
          </div>
        )}
        {query.isError && (
          <div className="mt-6 flex flex-col items-center py-6 text-center">
            <FiAlertCircle
              aria-hidden="true"
              className="h-8 w-8 text-zinc-400"
            />
            <p className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Không tải được hóa đơn
            </p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-3 flex min-h-[44px] items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Tải lại
            </button>
          </div>
        )}

        {order && (
          <div className="mt-4 flex flex-col gap-4">
            <section
              aria-label="Thông tin hóa đơn"
              className="rounded-xl border border-dashed border-zinc-300 p-3 text-xs dark:border-zinc-700"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
                <span className={orderStatusBadgeClass(order.status)}>
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                Ngày lập: {formatDateTime(order.createdAt)}
              </p>
            </section>

            <section aria-label="Khách hàng" className="text-xs">
              <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">
                Khách hàng
              </h3>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {order.customerName} · {order.customerPhone}
              </p>
              <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                {order.fulfillmentType === "pickup"
                  ? "Nhận tại xưởng"
                  : `Giao tận nơi · ${order.address?.fullText || "—"}`}
              </p>
            </section>

            <section aria-label="Chi tiết hàng">
              <ul className="divide-y divide-zinc-100 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {order.items.map((item) => (
                  <li
                    key={item.partId}
                    className="flex items-baseline justify-between gap-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {item.partName} × {item.quantity}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.sku} · {formatVnd(item.unitPrice)}/cái
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatVnd(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">Tạm tính</dt>
                  <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatVnd(order.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    Phí giao hàng
                  </dt>
                  <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                    {order.shippingFee > 0
                      ? formatVnd(order.shippingFee)
                      : "Miễn phí"}
                  </dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      Giảm giá
                    </dt>
                    <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                      −{formatVnd(order.discount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-200 pt-2 dark:border-zinc-800">
                  <dt className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    Tổng cộng
                  </dt>
                  <dd className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {formatVnd(order.total)}
                  </dd>
                </div>
              </dl>
            </section>

            <section
              aria-label="Thanh toán"
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">
                Thanh toán
              </h3>
              <dl className="mt-1.5 space-y-1">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    Phương thức
                  </dt>
                  <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                    {PAYMENT_METHOD_LABELS[payment?.method ?? ""] ??
                      PAYMENT_METHOD_LABELS[order.paymentMethod] ??
                      order.paymentMethod}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    Trạng thái
                  </dt>
                  <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {PAYMENT_STATUS_LABELS[payment?.status ?? ""] ??
                      PAYMENT_STATUS_LABELS[order.paymentStatus] ??
                      order.paymentStatus}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    Mã giao dịch
                  </dt>
                  <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                    {payment?.providerRef ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    Thời gian thanh toán
                  </dt>
                  <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatDateTime(payment?.paidAt ?? null)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
