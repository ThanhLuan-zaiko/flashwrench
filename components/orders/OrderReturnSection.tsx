"use client";

import { useState } from "react";
import { FiRotateCcw } from "react-icons/fi";
import { formatDateTime } from "@/lib/datetime/format";
import { canCustomerReturn } from "@/lib/orders/order-return";
import type { OrderDetail } from "@/lib/orders/orders.types";
import { OrderReturnDialog } from "./OrderReturnDialog";

// Customer-facing return block on the order page: the request button while
// the 3-day window is open, the pending-review card once filed, and the
// rejection note (with a re-request option) when staff declined.
export function OrderReturnSection({
  order,
  onError,
}: {
  order: OrderDetail;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const request = order.returnRequest;
  const eligible = canCustomerReturn(order, new Date());
  const rejected =
    order.status === "delivered" && request?.decision === "rejected";

  if (!eligible && !rejected && order.status !== "return_requested") {
    return null;
  }

  return (
    <section
      data-reveal
      aria-label="Đổi trả / hoàn tiền"
      className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Đổi trả / hoàn tiền
      </h2>

      {order.status === "return_requested" && request && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Đang chờ cửa hàng duyệt
          </p>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Gửi lúc {formatDateTime(request.requestedAt)} · Lý do:{" "}
            {request.reason}
          </p>
          {request.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {request.images.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* biome-ignore lint/performance/noImgElement: immutable /api/media evidence photo; optimizer hop adds nothing. */}
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
      )}

      {rejected && request && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Yêu cầu đổi trả bị từ chối
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {formatDateTime(request.decidedAt)}
            {request.decisionNote && ` · Lý do: ${request.decisionNote}`}
          </p>
        </div>
      )}

      {eligible && (
        <>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Điều kiện: trong 3 ngày kể từ khi nhận hàng, sản phẩm còn nguyên
            hiện vật và có ảnh minh chứng.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <FiRotateCcw aria-hidden="true" className="h-4 w-4" />
            {rejected
              ? "Gửi lại yêu cầu đổi trả"
              : "Yêu cầu đổi trả / hoàn tiền"}
          </button>
        </>
      )}

      {open && (
        <OrderReturnDialog
          orderId={order.id}
          onClose={() => setOpen(false)}
          onError={onError}
        />
      )}
    </section>
  );
}
