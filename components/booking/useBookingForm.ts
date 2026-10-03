"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { seedSessionUser } from "@/hooks/auth";
import { useCreateBooking } from "@/hooks/booking";
import { useSessionExpired } from "@/hooks/useSessionExpired";
import { buildBookingHref } from "@/lib/auth/auth-redirect";
import { validateCreateBookingInput } from "@/lib/booking/booking.validation";
import { BOOKING_SUCCESS_REDIRECT } from "@/lib/booking/booking-navigation";
import type { BookingFieldErrors } from "@/services/booking.api";
import { BookingApiError } from "@/services/booking.api";
import type { MapAddressValues } from "@/services/geocode.api";
import type { AddressValues } from "./BookingAddressSection";
import type { VehicleValues } from "./BookingVehicleSection";
import { defaultScheduled, minScheduled } from "./booking-datetime";
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
  // Guest mode: no session, so the form collects the contact trio
  // (name/phone/email) and success lands on the public tracking page.
  guest?: boolean;
};

// All booking form state and submit logic. `prefill` seeds the saved
// snapshot from the customer's last booking; `resetDetails` is the
// "type fresh" escape hatch that clears it without touching the picked
// service. Client validation mirrors the service rules for instant
// feedback; POST /api/bookings is the source of truth.
export function useBookingForm({
  initialServiceId,
  prefill,
  guest = false,
}: UseBookingFormOptions) {
  const router = useRouter();
  const toast = useToast();
  const sessionExpired = useSessionExpired();
  const queryClient = useQueryClient();
  const createBooking = useCreateBooking();
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [contact, setContact] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  // Guest inline signup: the contact trio doubles as the account
  // identity, so opting in only adds the password pair.
  const [signup, setSignup] = useState({
    enabled: false,
    password: "",
    confirmPassword: "",
  });
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
  const [prefilled, setPrefilled] = useState(prefill !== null);
  const [walletId, setWalletId] = useState<string | null>(null);

  const minSlot = useMemo(() => minScheduled(), []);

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
      fullName: guest ? contact.fullName : undefined,
      phone: guest ? contact.phone : undefined,
      email: guest ? contact.email : undefined,
      createAccount: guest && signup.enabled ? true : undefined,
      password: guest && signup.enabled ? signup.password : undefined,
      confirmPassword:
        guest && signup.enabled ? signup.confirmPassword : undefined,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      mechanicId: guest ? null : mechanicId,
      walletId: guest ? undefined : (walletId ?? undefined),
      ...address,
      ...vehicle,
    };
    const checked = validateCreateBookingInput(payload, { guest });
    if ("errors" in checked) {
      setErrors(checked.errors);
      return;
    }
    setErrors(EMPTY_ERRORS);
    createBooking.mutate(payload, {
      onSuccess: (data) => {
        // Inline signup: the same submit minted a session, so land on the
        // account-side confirmation instead of the public tracking page.
        if (data.user) {
          seedSessionUser(queryClient, data.user);
          toast.success(
            "Đặt lịch và tạo tài khoản thành công",
            "Đơn này đã nằm trong lịch sử tài khoản của bạn.",
          );
          router.replace(BOOKING_SUCCESS_REDIRECT);
          return;
        }
        toast.success("Đặt lịch thành công", "Thợ sẽ xác nhận trong vài phút.");
        // Guests hold no account history — the public tracking page is
        // their confirmation and follow-up channel.
        router.replace(
          guest
            ? `/track/booking/${data.booking.bookingId}?placed=1`
            : BOOKING_SUCCESS_REDIRECT,
        );
      },
      onError: (error) => {
        if (error instanceof BookingApiError) {
          if (sessionExpired(error, buildBookingHref(serviceId))) return;
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
    walletId,
    setWalletId,
    contact,
    setContact,
    signup,
    setSignup,
    address,
    setAddress,
    vehicle,
    setVehicle,
    errors,
    prefilled,
    pending: createBooking.isPending,
    minSlot,
    clearError,
    handleMapAddress,
    resetDetails,
    handleSubmit,
  };
}
