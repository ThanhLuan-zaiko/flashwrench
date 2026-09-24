"use client";

import dynamic from "next/dynamic";
import { FiAlertCircle, FiLoader, FiMapPin } from "react-icons/fi";
import { useBookingTravelPoints, useMyBooking } from "@/hooks/booking";
import type { BookingSummary } from "@/lib/booking/workspace.types";
import { STATUS_LABELS } from "@/lib/mechanic/mechanic-status";
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

type HistoryRoutePanelProps = {
  booking: BookingSummary | null;
};

export function HistoryRoutePanel({ booking }: HistoryRoutePanelProps) {
  const query = useBookingTravelPoints(
    booking?.id ?? null,
    booking?.status === "en_route",
  );
  const live =
    booking?.status === "en_route" || booking?.status === "in_progress";
  const detail = useMyBooking(live ? (booking?.id ?? null) : null, live);
  const points = query.data ?? [];
  const latest = points[points.length - 1] ?? null;
  const customer =
    booking && booking.addressLat !== null && booking.addressLng !== null
      ? { lat: booking.addressLat, lng: booking.addressLng }
      : null;
  const liveMechanic = detail.data?.location
    ? { lat: detail.data.location.lat, lng: detail.data.location.lng }
    : null;
  const map = historyMapModel(customer, liveMechanic, points);

  return (
    <section
      aria-label="Lộ trình thợ"
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Lộ trình di chuyển của thợ
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Chọn một đơn bên cạnh để xem các vị trí được ghi nhận khi thợ đang di
          chuyển. Lộ trình được lưu tối đa một năm.
        </p>
      </div>

      {!booking && (
        <div className="flex min-h-72 flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <FiMapPin aria-hidden="true" className="h-5 w-5 text-zinc-500" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Chọn một đơn để xem lộ trình
          </p>
        </div>
      )}

      {booking && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {booking.serviceNames.join(", ") || "Đơn sửa xe"}
            </p>
            <span className="shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400">
              {STATUS_LABELS[booking.status]}
            </span>
          </div>

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
                className="min-h-[44px] rounded-xl border border-red-300 px-4 py-2 text-xs font-semibold motion-safe:transition-colors motion-safe:duration-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
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

          {query.isSuccess && points.length === 0 && map.hasMap && (
            <p
              aria-live="polite"
              className="text-xs text-zinc-500 dark:text-zinc-400"
            >
              {booking.status === "en_route"
                ? liveMechanic
                  ? "Bản đồ đang hiển thị vị trí mới nhất của thợ; đường đi sẽ hiện khi có thêm điểm GPS."
                  : "Chưa có điểm GPS của thợ. Bản đồ đang hiển thị điểm sửa xe; thợ cần bật chia sẻ lộ trình khi đang di chuyển."
                : booking.status === "in_progress"
                  ? "Đơn đang sửa; chưa có lộ trình được ghi nhận trong giai đoạn thợ di chuyển."
                  : "Đơn này chưa có dữ liệu lộ trình. Đơn cũ trước khi bật ghi nhận vị trí sẽ không xem lại được đường đi."}
            </p>
          )}

          {query.isSuccess && points.length > 0 && latest && (
            <p
              aria-live="polite"
              className="text-[11px] text-zinc-500 dark:text-zinc-400"
            >
              {points.length > 1
                ? `${points.length} điểm lộ trình · Cập nhật ${new Date(latest.recordedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                : "Đã ghi nhận điểm đầu tiên; đường đi sẽ hiện sau lần cập nhật tiếp theo."}
            </p>
          )}

          {query.isSuccess && !map.hasMap && (
            <p className="flex min-h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Đơn này chưa có tọa độ để hiển thị trên bản đồ.
            </p>
          )}
        </>
      )}
    </section>
  );
}
