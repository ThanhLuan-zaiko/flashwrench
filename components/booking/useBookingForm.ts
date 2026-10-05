"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { seedSessionUser } from "@/hooks/auth";
import { useCreateBooking } from "@/hooks/booking";
import { publicCatalogKeys } from "@/hooks/public-catalog";
import { useBookingServiceSelection } from "@/hooks/useBookingServiceSelection";
import { useSessionExpired } from "@/hooks/useSessionExpired";
import { buildBookingHref } from "@/lib/auth/auth-redirect";
import { validateCreateBookingInput } from "@/lib/booking/booking.validation";
import { BOOKING_SUCCESS_REDIRECT } from "@/lib/booking/booking-navigation";
import {
  getBookingServiceSelection,
  replaceBookingServiceParams,
} from "@/lib/booking/booking-service-selection";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import type {
  BookingFieldErrors,
  CreateBookingResponse,
} from "@/services/booking.api";
import { BookingApiError } from "@/services/booking.api";
import type { MapAddressValues } from "@/services/geocode.api";
import type { AddressValues } from "./BookingAddressSection";
import type { VehicleValues } from "./BookingVehicleSection";
import { defaultScheduled, minScheduled } from "./booking-datetime";
import type { BookingDraft } from "./booking-draft";
import {
  type BookingPrefill,
  emptyAddressValues,
  emptyVehicleValues,
} from "./booking-prefill";
import { focusFirstInvalid } from "./focus-first-invalid";
import type { MapPoint } from "./MapPicker";
import { useBookingDraft } from "./useBookingDraft";

const EMPTY_ERRORS: BookingFieldErrors = {};

type UseBookingFormOptions = {
  initialServiceIds: string[];
  services: ServiceItem[];
  prefill: BookingPrefill | null;
  onCreated?: (response: CreateBookingResponse) => void;
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
  initialServiceIds,
  services,
  prefill,
  onCreated,
  guest = false,
}: UseBookingFormOptions) {
  const router = useRouter();
  const toast = useToast();
  const sessionExpired = useSessionExpired();
  const queryClient = useQueryClient();
  const createBooking = useCreateBooking();
  const draft = useBookingServiceSelection();
  const [selectedIds, setSelectedIds] = useState<string[] | null>(
    initialServiceIds.length > 0 ? initialServiceIds : null,
  );
  const serviceIds = selectedIds ?? draft.serviceIds;
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
  const [voucherCode, setVoucherCode] = useState("");
  const minSlot = useMemo(() => minScheduled(), []);
  const formRef = useRef<HTMLFormElement>(null);
  // Bumped per rejected submit; the effect below scrolls/focuses the
  // first flagged field since the confirm button lives in the aside.
  const [invalidAttempt, setInvalidAttempt] = useState(0);

  useEffect(() => {
    if (invalidAttempt > 0 && formRef.current)
      focusFirstInvalid(formRef.current);
  }, [invalidAttempt]);

  // Signup and password state deliberately stay out of the draft — only
  // plain form fields survive a reload.
  const draftValues = useMemo<BookingDraft>(
    () => ({ contact, scheduledAt, coords, address, vehicle, voucherCode }),
    [contact, scheduledAt, coords, address, vehicle, voucherCode],
  );
  const { clearDraft } = useBookingDraft({
    values: draftValues,
    onRestore: (draft) => {
      if (guest) setContact(draft.contact);
      // datetime-local strings compare lexicographically; a stale slot
      // earlier than the allowed minimum keeps the fresh default.
      if (draft.scheduledAt !== "" && draft.scheduledAt >= minSlot) {
        setScheduledAt(draft.scheduledAt);
      }
      setCoords(draft.coords);
      setAddress(draft.address);
      setVehicle(draft.vehicle);
      setVoucherCode(draft.voucherCode);
      // Shown values now come from the draft, not the last booking.
      setPrefilled(false);
    },
  });

  useEffect(() => {
    if (initialServiceIds.length > 0) draft.setServiceIds(initialServiceIds);
  }, [initialServiceIds, draft.setServiceIds]);

  useEffect(() => {
    if (
      window.location.pathname !== "/booking" ||
      (selectedIds === null && serviceIds.length === 0)
    )
      return;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const next = replaceBookingServiceParams(current, serviceIds);
    if (next !== current) window.history.replaceState(null, "", next);
  }, [serviceIds, selectedIds]);

  function setServiceIds(ids: string[]) {
    if (!draft.setServiceIds(ids)) return;
    setSelectedIds(ids);
    setWalletId(null);
    setErrors((previous) => ({
      ...previous,
      serviceId: undefined,
      serviceIds: undefined,
      walletId: undefined,
      form: undefined,
    }));
  }

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
    if (createBooking.isPending || createBooking.isSuccess) return;
    const selection = getBookingServiceSelection(serviceIds, services);
    if (selection.issue) {
      setErrors({ serviceIds: selection.issue });
      setInvalidAttempt((count) => count + 1);
      return;
    }
    // datetime-local carries wall time without a zone: pin it to the
    // browser zone here so the wire format is an unambiguous instant.
    // The validator and the service both reject zone-less strings.
    const picked = new Date(scheduledAt);
    if (Number.isNaN(picked.getTime())) {
      setErrors({ scheduledAt: "Khung giờ không hợp lệ." });
      setInvalidAttempt((count) => count + 1);
      return;
    }
    const payload = {
      serviceIds: [...serviceIds],
      expectedSubtotal: selection.subtotal,
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
      setInvalidAttempt((count) => count + 1);
      return;
    }
    setErrors(EMPTY_ERRORS);
    createBooking.mutate(payload, {
      onSuccess: (data) => {
        // Sent data must never come back as a draft — covers every
        // success branch below.
        clearDraft();
        onCreated?.(data);
        draft.removeServiceIds(data.booking.serviceIds);
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
          if (sessionExpired(error, buildBookingHref(serviceIds))) return;
          if (error.status === 404 || error.status === 409) {
            void queryClient.invalidateQueries({
              queryKey: publicCatalogKeys.all,
            });
          }
          setErrors(error.errors);
          setInvalidAttempt((count) => count + 1);
          toast.error(
            "Không tạo được lịch hẹn",
            error.errors.form ?? "Vui lòng kiểm tra lại thông tin.",
          );
        } else {
          setErrors({ form: "Không tạo được lịch hẹn. Vui lòng thử lại." });
          setInvalidAttempt((count) => count + 1);
          toast.error("Không tạo được lịch hẹn", "Vui lòng thử lại sau.");
        }
      },
    });
  }

  return {
    serviceIds,
    setServiceIds,
    scheduledAt,
    setScheduledAt,
    coords,
    setCoords,
    mechanicId,
    setMechanicId,
    walletId,
    setWalletId,
    voucherCode,
    setVoucherCode,
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
    pending: createBooking.isPending || createBooking.isSuccess,
    minSlot,
    clearError,
    handleMapAddress,
    resetDetails,
    handleSubmit,
    formRef,
  };
}
