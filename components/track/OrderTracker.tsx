"use client";

import dynamic from "next/dynamic";
import { useOrderTracking } from "@/hooks/track";
import { TrackAborted, TrackError, TrackLoading } from "./TrackFeedback";
import { type TrackStep, TrackStepper } from "./TrackStepper";

// Leaflet touches window at module scope — it must never evaluate
// during SSR, same rule as the history/dispatch map consumers.
const TrackingMap = dynamic(
  () =>
    import("@/components/history/TrackingMap").then(
      (module) => module.TrackingMap,
    ),
  { ssr: false },
);

const DELIVERY_STEPS: TrackStep[] = [
  { id: "pending", label: "Đã đặt hàng" },
  { id: "confirmed", label: "Đã xác nhận" },
  { id: "packing", label: "Đang đóng gói" },
  { id: "shipping", label: "Đang giao hàng" },
  { id: "delivered", label: "Đã giao hàng" },
];

// Counter pickup skips the courier leg entirely.
const PICKUP_STEPS: TrackStep[] = [
  { id: "pending", label: "Đã đặt hàng" },
  { id: "confirmed", label: "Đã xác nhận" },
  { id: "packing", label: "Đang chuẩn bị hàng" },
  { id: "delivered", label: "Đã nhận hàng" },
];

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

// Live journey for a guest order: polls the public endpoint — no login
// — and shows the courier pin against the drop address while shipping.
export function OrderTracker({ orderId }: { orderId: string }) {
  const query = useOrderTracking(orderId);
  const tracking = query.data?.tracking ?? null;

  if (query.isPending) return <TrackLoading />;
  if (query.isError || !tracking) return <TrackError />;

  if (tracking.status === "cancelled") {
    return (
      <TrackAborted
        title="Đơn hàng đã được hủy."
        body="Nếu bạn vẫn cần mua phụ tùng, hãy đặt đơn mới hoặc gọi hotline."
      />
    );
  }
  if (tracking.status === "refunded") {
    return (
      <TrackAborted
        title="Đơn hàng đã được hoàn tiền."
        body="Tiền hoàn về theo kênh bạn đã thanh toán. Gọi hotline nếu cần hỗ trợ."
      />
    );
  }

  const pickup = tracking.fulfillmentType === "pickup";
  const steps = pickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const stepIds = steps.map((step) => step.id);
  // A return request still reads as "delivered" on the journey — the
  // note below carries the detail.
  const statusIndex =
    tracking.status === "return_requested"
      ? stepIds.indexOf("delivered")
      : stepIds.indexOf(tracking.status);
  const activeIndex = Math.max(0, statusIndex);
  const stepHints: Record<string, string> = {};
  if (tracking.courierName && !pickup) {
    stepHints.shipping = tracking.trackingCode
      ? `${tracking.courierName} · ${tracking.trackingCode}`
      : tracking.courierName;
  }

  const destination = tracking.destination;
  const courier = tracking.courier;

  return (
    <div className="flex flex-col gap-4">
      {tracking.paymentStatus && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Thanh toán:{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {PAYMENT_LABELS[tracking.paymentStatus] ?? tracking.paymentStatus}
          </span>
          {pickup ? " · nhận hàng tại cửa hàng" : ""}
        </p>
      )}

      <TrackStepper
        ariaLabel="Tiến trình đơn hàng"
        steps={steps}
        activeIndex={activeIndex}
        stepHints={stepHints}
        updatedAt={tracking.updatedAt}
      />

      {tracking.status === "return_requested" && (
        <p className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          Yêu cầu trả hàng của bạn đang được xử lý — shop sẽ liên hệ theo thông
          tin bạn đã để lại.
        </p>
      )}

      {(courier || destination) && (
        <TrackingMap
          customer={destination}
          mechanic={courier ? { lat: courier.lat, lng: courier.lng } : null}
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
            Đọc mã này cho người giao hàng khi thanh toán — mã biến mất sau khi
            đơn được thanh toán.
          </p>
        </div>
      )}
    </div>
  );
}
