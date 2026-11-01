// Facts for the home price chapter: the catalog price range and the cancel
// window from the admin booking policy. The policy read races the marketing
// budget and degrades to null so the row simply drops out.

import { getBookingPolicy } from "@/lib/booking/booking-config.service";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { deadlineAfter } from "./budget";
import { SHOWCASE_BUDGET_MS } from "./mechanic-showcase.service";

export type PriceRange = { min: number; max: number };

// Lowest and highest base price among live services; null when none.
export function priceRangeOf(
  services: Pick<ServiceItem, "basePrice" | "isActive" | "isDeleted">[],
): PriceRange | null {
  const prices = services
    .filter((service) => service.isActive && !service.isDeleted)
    .map((service) => service.basePrice)
    .filter((price) => Number.isFinite(price) && price > 0);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// Hours before the appointment a customer may still cancel; null when the
// policy has no cutoff or cannot be read in time.
export async function loadCancelCutoffHours(): Promise<number | null> {
  try {
    const policy = await Promise.race([
      getBookingPolicy(),
      deadlineAfter(SHOWCASE_BUDGET_MS, "Booking policy"),
    ]);
    return policy.cancelCutoffHours > 0 ? policy.cancelCutoffHours : null;
  } catch {
    return null;
  }
}
