"use client";

import dynamic from "next/dynamic";
import { FiAlertCircle, FiLoader, FiMapPin, FiTruck } from "react-icons/fi";
import { useMyOrderTrack } from "@/hooks/orders";
import type { OrderSummary } from "@/lib/orders/orders.types";
import {
  ORDER_STATUS_LABELS,
  orderStatusBadgeClass,
} from "../orders/order-format";
import { historyMapModel } from "./history-map.utils";

const TrackingMap = dynamic(
  () => import("./TrackingMap").then((module) => module.TrackingMap),
  {
    ssr: false,
    loading: () => (
      <output
        aria-label="Đang tải bản đồ"
        className="h-72 w-full motion-safe:animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
      />
    ),
  },
);

type HistoryOrderTrackPanelProps = {
  order: OrderSummary | null;
};

// Delivery tracking for a parts order: destination pin, live mechanic
// position and the GPS breadcrumb trail. Third-party carriers have no
// in-house GPS — their name + tracking code stand in for live data.
export function HistoryOrderTrackPanel({ order }: HistoryOrderTrackPanelProps) {
  const trackable =
    order?.fulfillmentType === "delivery" &&
    (order.status === "shipping" ||
      order.status === "delivered" ||
      order.courierType !== null);
  const query = useMyOrderTrack(trackable ? (order?.id ?? null) : null);
  const track = query.data?.track ?? null;
  const courier =
    track?.courier != null
      ? { lat: track.courier.lat, lng: track.courier.lng }
      : null;
  const map = historyMapModel(
    track?.destination ?? null,
    courier,
    track?.points ?? [],
  );

  return (
    <section
      aria-label="Lộ trình giao hàng"
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Lộ trình giao hàng
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Chọn một đơn giao tận nơi để xem vị trí người giao và đường đi đã ghi
          nhận.
        </p>
      </div>

      {!order && (
        <div className="flex min-h-72 flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <FiMapPin aria-hidden="true" className="h-5 w-5 text-zinc-500" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Chọn một đơn để xem lộ trình
          </p>
        </div>
      )}

      {order && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Đơn #{order.id.slice(0, 8)} ·{" "}
              {order.fulfillmentType === "pickup"
                ? "Nhận tại xưởng"
                : "Giao tận nơi"}
            </p>
            <span className={orderStatusBadgeClass(order.status)}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          {order.fulfillmentType === "pickup" && (
            <p className="flex min-h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Đơn nhận tại xưởng — không có lộ trình giao hàng.
            </p>
          )}

          {order.fulfillmentType === "delivery" &&
            order.courierType === "third_party" && (
              <div className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <FiTruck
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <p>
                  Đơn giao qua{" "}
                  <span className="font-semibold">
                    {order.courierName ?? "đơn vị vận chuyển"}
                  </span>
                  {order.trackingCode && (
                    <>
                      {" "}
                      · Mã vận đơn:{" "}
                      <span className="font-semibold">
                        {order.trackingCode}
                      </span>
                    </>
                  )}
                  . Vị trí chi tiết xem trên trang của hãng vận chuyển.
                </p>
              </div>
            )}

          {order.fulfillmentType === "delivery" &&
            order.courierType !== "third_party" && (
              <>
                {query.isPending && (
                  <p
                    aria-busy="true"
                    className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    <FiLoader
                      aria-hidden="true"
                      className="h-4 w-4 motion-safe:animate-spin"
                    />
                    Đang tải dữ liệu lộ trình…
                  </p>
                )}
                {query.isError && (
                  <div
                    role="alert"
                    className="flex flex-col items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  >
                    <p className="flex items-center gap-2">
                      <FiAlertCircle
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0"
                      />
                      Không tải được lộ trình.
                    </p>
                    <button
                      type="button"
                      onClick={() => void query.refetch()}
                      className="min-h-[44px] rounded-xl border border-red-300 px-4 py-2 text-xs font-semibold transition-colors duration-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
                    >
                      Thử tải lại
                    </button>
                  </div>
                )}
                {map.hasMap && (
                  <TrackingMap
                    customer={map.customer}
                    mechanic={map.mechanic}
                    route={map.route ?? []}
                  />
                )}
                {query.isSuccess && !map.hasMap && (
                  <p className="flex min-h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    Đơn này chưa có tọa độ giao hàng để hiển thị trên bản đồ.
                  </p>
                )}
                {query.isSuccess &&
                  map.hasMap &&
                  track &&
                  track.points.length === 0 &&
                  !track.courier && (
                    <p
                      aria-live="polite"
                      className="text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      {order.status === "shipping"
                        ? "Chưa có điểm GPS của người giao. Bản đồ đang hiển thị điểm nhận hàng."
                        : "Đơn chưa ghi nhận điểm lộ trình nào."}
                    </p>
                  )}
              </>
            )}
        </>
      )}
    </section>
  );
}
