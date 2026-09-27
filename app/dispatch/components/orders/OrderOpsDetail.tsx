import { FiFileText } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { ORDER_STATUS_LABELS } from "@/components/orders/order-format";
import { formatDateTime } from "@/lib/datetime/format";
import type { OrderDetail, OrderStatus } from "@/lib/orders/orders.types";

// Read-only detail body for the ops dialog: customer, items, history.
// Transition controls live in OrderOpsDialog.
export function OrderOpsDetail({
  order,
  onViewInvoice,
}: {
  order: OrderDetail;
  onViewInvoice?: () => void;
}) {
  return (
    <>
      <section aria-label="Khách hàng">
        <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Giao cho
        </h3>
        <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {order.customerName} · {order.customerPhone}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {order.address?.fullText || "—"}
        </p>
        {order.note && (
          <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            Ghi chú khách: {order.note}
          </p>
        )}
      </section>

      <section aria-label="Sản phẩm">
        <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Sản phẩm
        </h3>
        <ul className="mt-1.5 divide-y divide-zinc-100 dark:divide-zinc-800">
          {order.items.map((item) => (
            <li
              key={item.partId}
              className="flex items-baseline justify-between gap-3 py-1.5"
            >
              <span className="min-w-0 truncate text-xs text-zinc-700 dark:text-zinc-300">
                {item.partName} × {item.quantity}
              </span>
              <span className="shrink-0 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                {formatVnd(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {order.returnRequest && (
        <section aria-label="Yêu cầu đổi trả">
          <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Yêu cầu đổi trả
          </h3>
          <div className="mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
              {order.returnRequest.reason}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              Gửi lúc {formatDateTime(order.returnRequest.requestedAt)}
              {order.returnRequest.decision &&
                ` · Đã ${
                  order.returnRequest.decision === "approved"
                    ? "duyệt"
                    : "từ chối"
                }`}
              {order.returnRequest.decisionNote &&
                ` · ${order.returnRequest.decisionNote}`}
            </p>
            {order.returnRequest.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {order.returnRequest.images.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Xem ảnh hiện trạng"
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Ảnh hiện trạng sản phẩm"
                      className="h-16 w-16 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section aria-label="Tiến trình">
        <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Tiến trình
        </h3>
        <ol className="mt-1.5 space-y-1.5">
          {order.history.map((entry, index) => (
            <li
              key={`${entry.changedAt ?? "init"}-${index}`}
              className="text-[11px] text-zinc-500 dark:text-zinc-400"
            >
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {ORDER_STATUS_LABELS[entry.newStatus as OrderStatus] ??
                  entry.newStatus}
              </span>
              {" · "}
              {formatDateTime(entry.changedAt)}
              {entry.note && ` · ${entry.note}`}
            </li>
          ))}
        </ol>
      </section>

      {onViewInvoice && (
        <button
          type="button"
          onClick={onViewInvoice}
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <FiFileText aria-hidden="true" className="h-4 w-4" />
          Xem hóa đơn chi tiết
        </button>
      )}
    </>
  );
}
