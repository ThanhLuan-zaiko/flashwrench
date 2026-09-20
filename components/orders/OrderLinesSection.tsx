import { formatVnd } from "@/app/admin/components/services/catalog-format";
import type { OrderDetail } from "@/lib/orders/orders.types";

// Line items plus the totals breakdown for one order detail panel.
export function OrderLinesSection({ order }: { order: OrderDetail }) {
  return (
    <section
      data-reveal
      aria-label="Sản phẩm trong đơn"
      className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Sản phẩm
      </h2>
      <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
        {order.items.map((item) => (
          <li key={item.partId} className="flex items-center gap-3 py-2.5">
            {item.partImage ? (
              // biome-ignore lint/performance/noImgElement: order thumbnails served immutable from the media store.
              <img
                src={item.partImage}
                alt=""
                loading="lazy"
                className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-800" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {item.partName}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {formatVnd(item.unitPrice)} × {item.quantity}
              </p>
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
              {formatVnd(item.lineTotal)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1.5 border-t border-zinc-200 pt-3 text-xs dark:border-zinc-800">
        <div className="flex justify-between">
          <dt className="text-zinc-500 dark:text-zinc-400">Tạm tính</dt>
          <dd className="font-semibold text-zinc-800 dark:text-zinc-200">
            {formatVnd(order.subtotal)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500 dark:text-zinc-400">Phí giao hàng</dt>
          <dd className="font-semibold text-zinc-800 dark:text-zinc-200">
            {formatVnd(order.shippingFee)}
          </dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">Giảm giá</dt>
            <dd className="font-semibold text-zinc-800 dark:text-zinc-200">
              -{formatVnd(order.discount)}
            </dd>
          </div>
        )}
        <div className="flex justify-between border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <dt className="font-semibold text-zinc-900 dark:text-zinc-50">
            Tổng cộng
          </dt>
          <dd className="font-bold text-zinc-900 dark:text-zinc-50">
            {formatVnd(order.total)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
