"use client";

import { TrackingMap } from "@/components/history/TrackingMap";
import { useBookingTracking } from "@/hooks/track";
import { formatDateTime } from "@/lib/datetime/format";
import { TrackAborted, TrackError, TrackLoading } from "./TrackFeedback";
import { type TrackStep, TrackStepper } from "./TrackStepper";

const BOOKING_STEPS: TrackStep[] = [
  { id: "pending", label: "Đã gửi yêu cầu" },
  { id: "confirmed", label: "Đã xác nhận" },
  { id: "mechanic_assigned", label: "Thợ đã nhận đơn" },
  { id: "en_route", label: "Thợ đang di chuyển" },
  { id: "in_progress", label: "Đang sửa xe" },
  { id: "completed", label: "Hoàn thành" },
];

// Live journey for a guest booking: polls the public endpoint — no
// login — and shows the mechanic pin against the service address while
// the mechanic is en route or working.
export function BookingTracker({ bookingId }: { bookingId: string }) {
  const query = useBookingTracking(bookingId);
  const tracking = query.data?.tracking ?? null;

  if (query.isPending) return <TrackLoading />;
  if (query.isError || !tracking) return <TrackError />;

  if (tracking.status === "cancelled") {
    return (
      <TrackAborted
        title="Đơn đặt lịch đã được hủy."
        body={
          tracking.cancelReason
            ? `Lý do: ${tracking.cancelReason}`
            : "Nếu bạn vẫn cần sửa xe, hãy đặt lịch mới hoặc gọi hotline."
        }
      />
    );
  }
  if (tracking.status === "no_show") {
    return (
      <TrackAborted
        title="Thợ đã đến nhưng không gặp được bạn."
        body="Đơn đã đóng. Nếu bạn vẫn cần sửa xe, hãy đặt lịch mới hoặc gọi hotline."
      />
    );
  }

  const stepIds = BOOKING_STEPS.map((step) => step.id);
  const activeIndex = Math.max(0, stepIds.indexOf(tracking.status));
  const mechanic = tracking.location;
  const destination = tracking.destination;
  const stepHints: Record<string, string> = {};
  if (tracking.mechanicName) {
    stepHints.mechanic_assigned = tracking.mechanicName;
    stepHints.en_route = tracking.mechanicName;
  }

  return (
    <div className="flex flex-col gap-4">
      {(tracking.serviceName || tracking.scheduledAt) && (
        <dl className="flex flex-col gap-1 text-sm">
          {tracking.serviceName && (
            <div className="flex gap-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Dịch vụ:</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                {tracking.serviceName}
              </dd>
            </div>
          )}
          {tracking.scheduledAt && (
            <div className="flex gap-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Giờ hẹn:</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                {formatDateTime(tracking.scheduledAt)}
              </dd>
            </div>
          )}
        </dl>
      )}

      <TrackStepper
        ariaLabel="Tiến trình đặt lịch"
        steps={BOOKING_STEPS}
        activeIndex={activeIndex}
        stepHints={stepHints}
        updatedAt={tracking.updatedAt}
      />

      {(mechanic || destination) && (
        <TrackingMap
          customer={destination}
          mechanic={mechanic ? { lat: mechanic.lat, lng: mechanic.lng } : null}
        />
      )}

      {tracking.paymentConfirmCode && (
        <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
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
    </div>
  );
}
