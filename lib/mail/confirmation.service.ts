// Fire-and-forget confirmation mail after a booking / rescue / parts order
// is created. A send failure must never break a flow that already persisted
// — the mail is only a courtesy copy of links the guest also sees on screen —
// so every call resolves through a catch-and-log path instead of throwing.
import type { CreatedBooking } from "@/lib/booking/booking.types";
import { formatDateTime } from "@/lib/datetime/format";
import {
  formatVnd,
  paymentMethodLabel,
  recordStatusLabel,
} from "@/lib/guest-access/guest-access.format";
import type { OrderDetail } from "@/lib/orders/orders.types";
import type { CreatedRescue } from "@/lib/rescue/rescue.types";
import { siteUrl } from "@/lib/seo/site";
import {
  buildConfirmationEmail,
  type ConfirmationDetail,
  type ConfirmationKind,
} from "./confirmation-email";
import { mailLogoAttachments } from "./email-shell";
import { isMailConfigured } from "./mail.config";
import { sendMail } from "./mailer.service";

// Mirrors the labels in components/rescue/rescue-constants.ts; kept local
// because lib/ modules never import from components/.
const RESCUE_ISSUE_LABELS: Record<string, string> = {
  flat_tire: "Thủng lốp / xẹp lốp",
  dead_battery: "Hết bình / đề không lên",
  engine_failure: "Chết máy / lỗi động cơ",
  accident: "Va chạm / tai nạn",
  out_of_fuel: "Hết nhiên liệu",
  overheating: "Xe quá nhiệt",
  locked_out: "Quên chìa / kẹt khóa",
  other: "Sự cố khác",
};

const RESCUE_HOTLINE_NOTE = "Trường hợp khẩn cấp, gọi hotline 1900 6368.";

function deliver(
  email: string | null | undefined,
  kind: ConfirmationKind,
  refId: string,
  customerName: string | null,
  details: ConfirmationDetail[],
  trackUrl: string | null,
  note?: string | null,
): void {
  const to = typeof email === "string" ? email.trim() : "";
  if (!to || !isMailConfigured()) return;
  const content = buildConfirmationEmail({
    kind,
    customerName,
    refId,
    details,
    trackUrl,
    note,
  });
  void sendMail({ to, ...content, attachments: mailLogoAttachments() }).catch(
    (error) => {
      console.warn(
        `[mail] ${kind} confirmation ${refId} failed:`,
        error instanceof Error ? error.message : error,
      );
    },
  );
}

export function notifyBookingCreated(
  booking: CreatedBooking,
  email: string | null | undefined,
  customerName?: string | null,
): void {
  const details: ConfirmationDetail[] = [
    { label: "Dịch vụ", value: booking.serviceName },
    {
      label: "Thời gian hẹn",
      value: formatDateTime(booking.scheduledAt, {
        timeZone: booking.timezone,
      }),
    },
    { label: "Địa chỉ", value: booking.address },
    { label: "Biển số xe", value: booking.vehiclePlate },
  ];
  if (booking.mechanicName) {
    details.push({ label: "Thợ phụ trách", value: booking.mechanicName });
  }
  details.push({ label: "Tổng dự kiến", value: formatVnd(booking.total) });
  deliver(
    email,
    "booking",
    booking.bookingId,
    customerName ?? null,
    details,
    `${siteUrl()}/track/booking/${booking.bookingId}`,
  );
}

export function notifyRescueCreated(
  rescue: CreatedRescue,
  email: string | null | undefined,
): void {
  const details: ConfirmationDetail[] = [
    {
      label: "Sự cố",
      value: RESCUE_ISSUE_LABELS[rescue.issueType] ?? rescue.issueType,
    },
    { label: "Trạng thái", value: recordStatusLabel(rescue.status) },
    { label: "Địa chỉ", value: rescue.address },
    { label: "Biển số xe", value: rescue.vehiclePlate },
  ];
  if (rescue.assignedMechanicName) {
    details.push({
      label: "Thợ phụ trách",
      value: rescue.assignedMechanicName,
    });
  }
  deliver(
    email,
    "rescue",
    rescue.requestId,
    rescue.customerName,
    details,
    null,
    RESCUE_HOTLINE_NOTE,
  );
}

export function notifyOrderCreated(order: OrderDetail): void {
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const details: ConfirmationDetail[] = [
    {
      label: "Hình thức nhận",
      value:
        order.fulfillmentType === "pickup" ? "Nhận tại xưởng" : "Giao tận nơi",
    },
    { label: "Sản phẩm", value: `${quantity} món` },
    { label: "Thanh toán", value: paymentMethodLabel(order.paymentMethod) },
  ];
  if (order.address?.fullText) {
    details.push({ label: "Địa chỉ giao", value: order.address.fullText });
  }
  details.push({ label: "Tổng cộng", value: formatVnd(order.total) });
  deliver(
    order.customerEmail,
    "order",
    order.id,
    order.customerName,
    details,
    `${siteUrl()}/track/order/${order.id}`,
  );
}
