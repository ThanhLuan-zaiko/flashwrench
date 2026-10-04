import type { BookingFieldErrors } from "./booking.types";
import { decodeBookingServiceIds } from "./booking-service-selection";
import { BOOKING_MAX_SERVICES } from "./booking-services.constants";
import { normalizeBookingServices } from "./booking-services.validation";

export const BOOKING_SELECTION_KEY = "flashwrench.booking-services";

type SelectionStorage = Pick<Storage, "getItem" | "setItem">;

export function createBookingSelectionStore(
  storage: () => SelectionStorage | null = () => null,
) {
  let snapshot = "";
  let loaded = false;
  const listeners = new Set<() => void>();

  function getSnapshot(): string {
    if (!loaded) {
      loaded = true;
      try {
        snapshot = storage()?.getItem(BOOKING_SELECTION_KEY) ?? "";
      } catch {
        snapshot = "";
      }
    }
    return snapshot;
  }

  function setServiceIds(serviceIds: readonly string[]): boolean {
    const errors: BookingFieldErrors = {};
    const normalized =
      serviceIds.length === 0
        ? []
        : normalizeBookingServices({ serviceIds: [...serviceIds] }, errors)
            .serviceIds;
    if (Object.keys(errors).length > 0) return false;
    const next = JSON.stringify(normalized);
    if (loaded && snapshot === next) return true;
    snapshot = next;
    loaded = true;
    try {
      storage()?.setItem(BOOKING_SELECTION_KEY, snapshot);
    } catch {}
    for (const listener of listeners) listener();
    return true;
  }

  function toggleService(id: string): boolean {
    const ids = decodeBookingServiceIds(getSnapshot());
    if (ids.includes(id))
      return setServiceIds(ids.filter((value) => value !== id));
    if (ids.length >= BOOKING_MAX_SERVICES) return false;
    return setServiceIds([...ids, id]);
  }

  function removeServiceIds(serviceIds: readonly string[]): void {
    const submitted = new Set(serviceIds);
    setServiceIds(
      decodeBookingServiceIds(getSnapshot()).filter((id) => !submitted.has(id)),
    );
  }

  return {
    getSnapshot,
    getServerSnapshot: () => "",
    setServiceIds,
    toggleService,
    removeServiceIds,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
