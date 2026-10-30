"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { formatDuration } from "@/app/admin/components/services/catalog-format";
import { useBookingTracking } from "@/hooks/track";
import { formatDateTime, formatShortDateTime } from "@/lib/datetime/format";
import {
  bookingTrackStage,
  distanceKm,
  estimateEtaMinutes,
  formatKm,
} from "@/lib/track/booking-track-view";
import { TrackActionBar } from "./TrackActionBar";
import { TrackAborted, TrackError, TrackLoading } from "./TrackFeedback";
import { TrackHero } from "./TrackHero";
import { TrackMechanicCard } from "./TrackMechanicCard";
import { TrackProgressCard } from "./TrackProgressCard";

// Leaflet touches window at module scope — it must never evaluate
// during SSR, same rule as the history/dispatch map consumers.
const TrackingMap = dynamic(
  () =>
    import("@/components/history/TrackingMap").then(
      (module) => module.TrackingMap,
    ),
  { ssr: false },
);

function Padded({ children }: { children: ReactNode }) {
  return <div className="px-4 sm:px-0">{children}</div>;
}

// Live journey for a guest booking: polls the public endpoint — no
// login. Navy status band, the map overlapping it, the mechanic, the
// four-stage progress card and a docked support bar.
export function BookingTracker({ bookingId }: { bookingId: string }) {
  const query = useBookingTracking(bookingId);
  const tracking = query.data?.tracking ?? null;

  if (query.isPending)
    return (
      <Padded>
        <TrackLoading />
      </Padded>
    );
  if (query.isError || !tracking)
    return (
      <Padded>
        <TrackError />
      </Padded>
    );

  if (tracking.status === "cancelled" || tracking.status === "no_show") {
    return (
      <Padded>
        {tracking.status === "cancelled" ? (
          <TrackAborted
            title="Đơn đặt lịch đã được hủy."
            body={
              tracking.cancelReason
                ? `Lý do: ${tracking.cancelReason}`
                : "Nếu bạn vẫn cần sửa xe, hãy đặt lịch mới hoặc gọi hotline."
            }
          />
        ) : (
          <TrackAborted
            title="Thợ đã đến nhưng không gặp được bạn."
            body="Đơn đã đóng. Nếu bạn vẫn cần sửa xe, hãy đặt lịch mới hoặc gọi hotline."
          />
        )}
      </Padded>
    );
  }

  const stage = bookingTrackStage(tracking.status);
  const mechanic = tracking.location;
  const destination = tracking.destination;
  const km = mechanic && destination ? distanceKm(mechanic, destination) : null;
  const etaMin = stage === 1 && km !== null ? estimateEtaMinutes(km) : null;
  const scheduled = tracking.scheduledAt
    ? formatShortDateTime(tracking.scheduledAt, {
        timeZone: tracking.timezone,
      })
    : null;
  const detail = [
    etaMin !== null ? "Ước tính theo vị trí thợ" : null,
    scheduled ? `Giờ hẹn ${scheduled}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const details = [
    [scheduled, tracking.serviceName].filter(Boolean).join(" · ") || null,
    tracking.mechanicName
      ? [
          tracking.mechanicName,
          etaMin !== null ? `còn khoảng ${etaMin} phút` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Đang tìm thợ phù hợp",
    tracking.durationMin
      ? `Dự kiến ${formatDuration(tracking.durationMin)}`
      : "Thợ kiểm tra và sửa xe",
    "Thanh toán sau khi bàn giao xe",
  ];

  return (
    <div className="flex flex-col gap-3">
      <TrackHero stage={stage} etaMin={etaMin} detail={detail || null} />
      <div className="-mt-12 flex flex-col gap-3 px-4 sm:px-3">
        {(mechanic || destination) && (
          <div className="relative">
            <TrackingMap
              customer={destination}
              mechanic={
                mechanic ? { lat: mechanic.lat, lng: mechanic.lng } : null
              }
              mapClassName="h-44 w-full sm:h-56"
            />
            {km !== null && (
              <span className="absolute bottom-2 left-2 z-10 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                Cách bạn {formatKm(km)}
              </span>
            )}
          </div>
        )}
        {tracking.mechanicName && (
          <TrackMechanicCard name={tracking.mechanicName} />
        )}
        <TrackProgressCard stage={stage} details={details} />
        {tracking.paymentConfirmCode && (
          <div className="rounded-2xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Mã xác nhận thanh toán tiền mặt
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-[0.3em] text-zinc-900 dark:text-zinc-50">
              {tracking.paymentConfirmCode}
            </p>
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Đọc mã này cho thợ khi thanh toán — mã biến mất sau khi đơn được
              thanh toán.
            </p>
          </div>
        )}
        {tracking.updatedAt && (
          <p
            aria-live="polite"
            className="text-[11px] text-zinc-400 dark:text-zinc-500"
          >
            Cập nhật {formatDateTime(tracking.updatedAt)} · tự làm mới mỗi 15
            giây
          </p>
        )}
      </div>
      <TrackActionBar />
    </div>
  );
}
