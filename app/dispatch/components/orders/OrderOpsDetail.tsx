import { formatVnd } from "@/app/admin/components/services/catalog-format";
import { ORDER_STATUS_LABELS } from "@/components/orders/order-format";
import { formatDateTime } from "@/lib/datetime/format";
import type { OrderDetail, OrderStatus } from "@/lib/orders/orders.types";

// Read-only detail body for the ops dialog: customer, items, history.
// Transition controls live in OrderOpsDialog.
export function OrderOpsDetail({ order }: { order: OrderDetail }) {
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
    </>
  );
}
