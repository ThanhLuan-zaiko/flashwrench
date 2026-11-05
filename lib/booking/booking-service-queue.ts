import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { getBookingServiceSelection } from "./booking-service-selection";

// Services the customer wants to book after the current appointment. They
// cannot share it (one appointment means one mechanic, place and time), so
// they wait here in the tab's sessionStorage until the next booking starts.
export const BOOKING_QUEUE_KEY = "flashwrench.booking-service-queue";

// The next appointment: the first queued service plus every later one that
// can share it. Services that left the catalog are skipped.
export function nextBookingGroup(
  queuedIds: readonly string[],
  catalog: readonly ServiceItem[],
): string[] {
  const group: string[] = [];
  for (const id of queuedIds) {
    const candidate = [...group, id];
    if (!getBookingServiceSelection(candidate, catalog).issue) group.push(id);
  }
  return group;
}

// Names the service that forces the split, so the message explains this
// exact conflict. Other limits (service count, total duration) reuse the
// selection issue as written.
export function describeBookingConflict(
  candidate: ServiceItem,
  selected: readonly ServiceItem[],
  issue: string | null,
): string {
  const offsite = selected
    .filter((service) => !service.isHomeSupported)
    .map((service) => service.name);
  if (!candidate.isHomeSupported) offsite.unshift(candidate.name);
  if (offsite.length === 0)
    return issue ?? "Không thể đặt chung trong một lịch hẹn.";
  return offsite.length === 1
    ? `${offsite[0]} không hỗ trợ tại nhà nên cần một lịch hẹn riêng.`
    : `${offsite.join(", ")} không hỗ trợ tại nhà nên mỗi dịch vụ cần một lịch hẹn riêng.`;
}
