// UI-only formatting for the lookup screen. The shared labels and the VND
// formatter live in lib/guest-access/guest-access.format.ts because the PDF
// renderer needs them too and must not import a component module.
import {
  formatVnd,
  paymentMethodLabel,
  paymentStatusLabel,
  recordStatusLabel,
} from "@/lib/guest-access/guest-access.format";
import type { GuestRecordSummary } from "@/lib/guest-access/guest-access.types";

export { formatVnd, paymentMethodLabel, paymentStatusLabel, recordStatusLabel };

/** Second line of a record row: when it happens, or who handles it. */
export function recordSubtitle(record: GuestRecordSummary): string {
  if (record.type === "booking" && record.scheduledAt) {
    return `Hẹn ${new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(record.scheduledAt))}`;
  }
  if (record.type === "rescue" && record.mechanicName) {
    return `Thợ: ${record.mechanicName}`;
  }
  if (record.createdAt) {
    return `Ngày ${new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
    }).format(new Date(record.createdAt))}`;
  }
  return "";
}
