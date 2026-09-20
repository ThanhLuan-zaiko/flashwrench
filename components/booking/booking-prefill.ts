import type { BookingSummary } from "@/lib/booking/workspace.types";
import type { AddressValues } from "./BookingAddressSection";
import type { VehicleValues } from "./BookingVehicleSection";
import type { MapPoint } from "./MapPicker";

// Reusable snapshot of the customer's most recent booking: pin, typed
// address and vehicle. Schedule and service always stay fresh — a
// rebook is about *when*, the rest usually stays the same.
export type BookingPrefill = {
  coords: MapPoint | null;
  address: AddressValues;
  vehicle: VehicleValues;
  mechanicId: string | null;
};

export function emptyAddressValues(): AddressValues {
  return { address: "", province: "", district: "", ward: "", street: "" };
}

export function emptyVehicleValues(): VehicleValues {
  return { vehiclePlate: "", vehicleBrand: "", vehicleModel: "", notes: "" };
}

// Maps the latest booking summary into form state. Returns null when
// the booking carries nothing worth reusing, so the notice never shows
// for an empty snapshot.
export function toBookingPrefill(
  booking: BookingSummary | null,
): BookingPrefill | null {
  if (!booking) return null;
  const coords =
    booking.addressLat !== null && booking.addressLng !== null
      ? { lat: booking.addressLat, lng: booking.addressLng }
      : null;
  const hasSaved =
    coords !== null ||
    booking.addressText.trim().length > 0 ||
    booking.vehiclePlate.trim().length > 0 ||
    booking.mechanicId !== null;
  if (!hasSaved) return null;
  return {
    coords,
    address: { ...emptyAddressValues(), address: booking.addressText },
    vehicle: {
      vehiclePlate: booking.vehiclePlate,
      vehicleBrand: booking.vehicleBrand,
      vehicleModel: booking.vehicleModel,
      notes: booking.notes,
    },
    mechanicId: booking.mechanicId,
  };
}
