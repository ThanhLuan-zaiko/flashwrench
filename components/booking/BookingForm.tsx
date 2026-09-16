"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FiCalendar, FiLoader } from "react-icons/fi";
import { FormAlert } from "@/components/auth/FormAlert";
import { useToast } from "@/components/toast/useToast";
import { useCreateBooking } from "@/hooks/booking";
import { buildBookingHref, buildLoginHref } from "@/lib/auth/auth-redirect";
import { validateCreateBookingInput } from "@/lib/booking/booking.validation";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import type {
  BookingFieldErrors,
  CreatedBooking,
} from "@/services/booking.api";
import { BookingApiError } from "@/services/booking.api";
import type { MapAddressValues } from "@/services/geocode.api";
import {
  type AddressValues,
  BookingAddressSection,
} from "./BookingAddressSection";
import { BookingMapSection } from "./BookingMapSection";
import { BookingScheduleSection } from "./BookingScheduleSection";
import { BookingServiceSection } from "./BookingServiceSection";
import { BookingSuccess } from "./BookingSuccess";
import {
  BookingVehicleSection,
  type VehicleValues,
} from "./BookingVehicleSection";
import {
  defaultScheduled,
  maxScheduled,
  minScheduled,
} from "./booking-datetime";
import type { MapPoint } from "./MapPicker";
import { MechanicSection } from "./MechanicSection";

type BookingFormProps = {
  preselected: ServiceItem | null;
  services: ServiceItem[];
  initialServiceId: string | null;
};

const EMPTY_ERRORS: BookingFieldErrors = {};

// Real booking form: service, map-pinned location, schedule, address,
// mechanic and vehicle. Client validation mirrors the service rules for
// instant feedback; POST /api/bookings is the source of truth and its
// field errors land on the same inputs. Success swaps to the
// confirmation panel in place.
export function BookingForm({
  preselected,
  services,
  initialServiceId,
}: BookingFormProps) {
  const router = useRouter();
  const toast = useToast();
  const createBooking = useCreateBooking();
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduled);
  const [coords, setCoords] = useState<MapPoint | null>(null);
  const [mechanicId, setMechanicId] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressValues>({
    address: "",
    province: "",
    district: "",
    ward: "",
    street: "",
  });
  const [vehicle, setVehicle] = useState<VehicleValues>({
    vehiclePlate: "",
    vehicleBrand: "",
    vehicleModel: "",
    notes: "",
  });
  const [errors, setErrors] = useState<BookingFieldErrors>(EMPTY_ERRORS);
  const [created, setCreated] = useState<CreatedBooking | null>(null);

  const minSlot = useMemo(() => minScheduled(), []);
  const maxSlot = useMemo(() => maxScheduled(), []);

  if (created) return <BookingSuccess booking={created} />;
  const pending = createBooking.isPending;

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

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Đặt lịch sửa xe"
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {errors.form && <FormAlert message={errors.form} />}

      <BookingServiceSection
        preselected={preselected}
        services={services}
        serviceId={serviceId}
        error={errors.serviceId}
        disabled={pending}
        onServiceId={(v) => {
          setServiceId(v);
          clearError("serviceId");
        }}
      />

      <BookingMapSection
        lat={coords?.lat ?? null}
        lng={coords?.lng ?? null}
        error={errors.location}
        onCoords={(point) => {
          setCoords(point);
          clearError("location");
        }}
        onAddress={handleMapAddress}
      />

      <BookingScheduleSection
        value={scheduledAt}
        min={minSlot}
        max={maxSlot}
        error={errors.scheduledAt}
        disabled={pending}
        onChange={(v) => {
          setScheduledAt(v);
          clearError("scheduledAt");
        }}
      />

      <BookingAddressSection
        values={address}
        errors={errors}
        disabled={pending}
        onChange={(field, v) => {
          setAddress((prev) => ({ ...prev, [field]: v }));
          clearError(field);
        }}
      />

      <BookingVehicleSection
        values={vehicle}
        errors={errors}
        disabled={pending}
        onChange={(field, v) => {
          setVehicle((prev) => ({ ...prev, [field]: v }));
          clearError(field);
        }}
      />

      <MechanicSection
        lat={coords?.lat ?? null}
        lng={coords?.lng ?? null}
        value={mechanicId}
        error={errors.mechanicId}
        disabled={pending}
        onChange={(v) => {
          setMechanicId(v);
          clearError("mechanicId");
        }}
      />

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950"
      >
        {pending ? (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        ) : (
          <FiCalendar aria-hidden="true" className="h-4 w-4" />
        )}
        {pending ? "Đang tạo lịch hẹn…" : "Xác nhận đặt lịch"}
      </button>
    </form>
  );
}
