"use client";

import dynamic from "next/dynamic";
import { FiAlertCircle, FiLoader, FiMapPin } from "react-icons/fi";
import { historyMapModel } from "@/components/history/history-map.utils";
import { useDispatchBooking, useDispatchBookingTrack } from "@/hooks/dispatch";
import type { BookingSummary } from "@/services/dispatch.api";
import { DISPATCH_STATUS_LABELS } from "./dispatch-tabs";

const TrackingMap = dynamic(
  () =>
    import("@/components/history/TrackingMap").then(
      (module) => module.TrackingMap,
    ),
  { ssr: false },
);

type DispatchTrackingPanelProps = {
  booking: BookingSummary | null;
};

export function DispatchTrackingPanel({ booking }: DispatchTrackingPanelProps) {
  const live =
    booking?.status === "en_route" || booking?.status === "in_progress";
  const trackQuery = useDispatchBookingTrack(
    booking?.id ?? null,
    booking?.status === "en_route",
  );
  const detailQuery = useDispatchBooking(
    live ? (booking?.id ?? null) : null,
    live,
  );
  const points = trackQuery.data ?? [];
  const latest = points[points.length - 1] ?? null;
  const customer =
    booking && booking.addressLat !== null && booking.addressLng !== null
      ? { lat: booking.addressLat, lng: booking.addressLng }
      : null;
  const liveMechanic = detailQuery.data?.booking.location
    ? {
        lat: detailQuery.data.booking.location.lat,
        lng: detailQuery.data.booking.location.lng,
      }
    : null;
  const map = historyMapModel(customer, liveMechanic, points);

  return (
    <section
      aria-label="Bản đồ và lộ trình đơn"
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Bản đồ di chuyển của thợ
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Chọn một đơn để xem vị trí hiện tại và lộ trình đã ghi nhận.
        </p>
      </div>

      {!booking && (
        <div className="flex min-h-72 flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <FiMapPin aria-hidden="true" className="h-5 w-5 text-zinc-500" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Chọn một đơn để xem bản đồ
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
              {DISPATCH_STATUS_LABELS[booking.status]}
            </span>
          </div>

          {trackQuery.isPending && (
            <p
              aria-busy="true"
              className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
            >
              <FiLoader
                aria-hidden="true"
                className="h-4 w-4 motion-safe:animate-spin"
              />
              Đang tải lộ trình…
            </p>
          )}
          {trackQuery.isError && (
            <p
              role="alert"
              className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400"
            >
              <FiAlertCircle aria-hidden="true" className="h-4 w-4" />
              Không tải được lộ trình.
            </p>
          )}

          {map.hasMap && (
            <TrackingMap
              customer={map.customer}
              mechanic={map.mechanic}
              route={map.route ?? []}
            />
          )}

          {trackQuery.isSuccess && points.length === 0 && map.hasMap && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {booking.status === "en_route"
                ? liveMechanic
                  ? "Đang hiển thị vị trí mới nhất; lộ trình thực tế sẽ hiện khi có thêm điểm GPS."
                  : "Bản đồ đang hiển thị điểm sửa xe. Thợ cần bật chia sẻ lộ trình khi đang di chuyển."
                : booking.status === "in_progress"
                  ? "Đơn đang sửa; chưa có lộ trình được ghi nhận trong giai đoạn di chuyển."
                  : "Đơn này chưa có điểm lộ trình được ghi nhận trong giai đoạn di chuyển."}
            </p>
          )}

          {trackQuery.isSuccess && points.length > 0 && latest && (
            <p
              aria-live="polite"
              className="text-[11px] text-zinc-500 dark:text-zinc-400"
            >
              {points.length > 1
                ? `${points.length} điểm lộ trình · Cập nhật ${new Date(latest.recordedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
                : "Đã ghi nhận điểm đầu tiên; đường đi sẽ hiện sau lần cập nhật tiếp theo."}
            </p>
          )}

          {trackQuery.isSuccess && !map.hasMap && (
            <p className="flex min-h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Đơn này chưa có tọa độ để hiển thị trên bản đồ.
            </p>
          )}
        </>
      )}
    </section>
  );
}
