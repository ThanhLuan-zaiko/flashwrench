"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { useCreateBooking } from "@/hooks/booking";
import { buildBookingHref, buildLoginHref } from "@/lib/auth/auth-redirect";
import { validateCreateBookingInput } from "@/lib/booking/booking.validation";
import type {
  BookingFieldErrors,
  CreatedBooking,
} from "@/services/booking.api";
import { BookingApiError } from "@/services/booking.api";
import type { MapAddressValues } from "@/services/geocode.api";
import type { AddressValues } from "./BookingAddressSection";
import type { VehicleValues } from "./BookingVehicleSection";
import {
  defaultScheduled,
  maxScheduled,
  minScheduled,
} from "./booking-datetime";
import {
  type BookingPrefill,
  emptyAddressValues,
  emptyVehicleValues,
} from "./booking-prefill";
import type { MapPoint } from "./MapPicker";

const EMPTY_ERRORS: BookingFieldErrors = {};

type UseBookingFormOptions = {
  initialServiceId: string | null;
  prefill: BookingPrefill | null;
};

// All booking form state and submit logic. `prefill` seeds the saved
// snapshot from the customer's last booking; `resetDetails` is the
// "type fresh" escape hatch that clears it without touching the picked
// service. Client validation mirrors the service rules for instant
// feedback; POST /api/bookings is the source of truth.
export function useBookingForm({
  initialServiceId,
  prefill,
}: UseBookingFormOptions) {
  const router = useRouter();
  const toast = useToast();
  const createBooking = useCreateBooking();
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduled);
  const [coords, setCoords] = useState<MapPoint | null>(
    prefill?.coords ?? null,
  );
  const [mechanicId, setMechanicId] = useState<string | null>(
    prefill?.mechanicId ?? null,
  );
  const [address, setAddress] = useState<AddressValues>(
    prefill?.address ?? emptyAddressValues(),
  );
  const [vehicle, setVehicle] = useState<VehicleValues>(
    prefill?.vehicle ?? emptyVehicleValues(),
  );
  const [errors, setErrors] = useState<BookingFieldErrors>(EMPTY_ERRORS);
  const [created, setCreated] = useState<CreatedBooking | null>(null);
  const [prefilled, setPrefilled] = useState(prefill !== null);

  const minSlot = useMemo(() => minScheduled(), []);
  const maxSlot = useMemo(() => maxScheduled(), []);

  function clearError(field: keyof BookingFieldErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  }

  // Reverse-geocoded values fill every address field at once; the
  // customer can still edit each one by hand afterwards.
  function handleMapAddress(values: MapAddressValues) {
    setAddress((prev) => ({ ...prev, ...values }));
    setErrors((prev) => ({
      ...prev,
      address: undefined,
      province: undefined,
      district: undefined,
      ward: undefined,
      street: undefined,
    }));
  }

  function resetDetails() {
    setCoords(null);
    setMechanicId(null);
    setAddress(emptyAddressValues());
    setVehicle(emptyVehicleValues());
    setScheduledAt(defaultScheduled());
    setErrors(EMPTY_ERRORS);
    setPrefilled(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // datetime-local carries wall time without a zone: pin it to the
    // browser zone here so the wire format is an unambiguous instant.
    // The validator and the service both reject zone-less strings.
    const picked = new Date(scheduledAt);
    if (Number.isNaN(picked.getTime())) {
      setErrors({ scheduledAt: "Khung giờ không hợp lệ." });
      return;
    }
    const payload = {
      serviceId,
      scheduledAt: picked.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      mechanicId,
      ...address,
      ...vehicle,
    };
    const checked = validateCreateBookingInput(payload);
    if ("errors" in checked) {
      setErrors(checked.errors);
      return;
    }
    setErrors(EMPTY_ERRORS);
    createBooking.mutate(payload, {
      onSuccess: (data) => {
        setCreated(data.booking);
        toast.success("Đặt lịch thành công", "Thợ sẽ xác nhận trong vài phút.");
      },
      onError: (error) => {
        if (error instanceof BookingApiError) {
          if (error.status === 401) {
            toast.error("Phiên đăng nhập đã hết", "Vui lòng đăng nhập lại.");
            router.push(buildLoginHref(buildBookingHref(serviceId)));
            return;
          }
          setErrors(error.errors);
          toast.error(
            "Không tạo được lịch hẹn",
            error.errors.form ?? "Vui lòng kiểm tra lại thông tin.",
          );
        } else {
          setErrors({ form: "Không tạo được lịch hẹn. Vui lòng thử lại." });
          toast.error("Không tạo được lịch hẹn", "Vui lòng thử lại sau.");
        }
      },
    });
  }

  return {
    serviceId,
    setServiceId,
    scheduledAt,
    setScheduledAt,
    coords,
    setCoords,
    mechanicId,
    setMechanicId,
    address,
    setAddress,
    vehicle,
    setVehicle,
    errors,
    created,
    prefilled,
    pending: createBooking.isPending,
    minSlot,
    maxSlot,
    clearError,
    handleMapAddress,
    resetDetails,
    handleSubmit,
  };
}
