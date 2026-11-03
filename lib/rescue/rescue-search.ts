import { matchesSearch } from "@/lib/search-text";
import type { RescueDetail } from "./rescue-reader.service";

// Dispatcher rescue search: request id, customer, phone, plate and address.
export type RescueSearchable = Pick<
  RescueDetail,
  "requestId" | "customerName" | "customerPhone" | "vehiclePlate" | "address"
>;

export function matchesRescueSearch(
  rescue: RescueSearchable,
  query: string,
): boolean {
  return matchesSearch(query, [
    rescue.requestId,
    rescue.customerName,
    rescue.customerPhone,
    rescue.vehiclePlate,
    rescue.address,
  ]);
}
