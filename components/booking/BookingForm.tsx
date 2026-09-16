"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FiCalendar, FiLoader } from "react-icons/fi";
import { formatVnd } from "@/app/admin/components/services/catalog-format";
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
import {
  type AddressValues,
  BookingAddressSection,
} from "./BookingAddressSection";
import type { ServiceOption } from "./BookingFormFields";
import { BookingScheduleSection } from "./BookingScheduleSection";
import { BookingServiceSection } from "./BookingServiceSection";
import { BookingSuccess } from "./BookingSuccess";
import {
  BookingVehicleSection,
  type VehicleValues,
} from "./BookingVehicleSection";

type BookingFormProps = {
  preselected: ServiceItem | null;
  services: ServiceItem[];
  initialServiceId: string | null;
};

const EMPTY_ERRORS: BookingFieldErrors = {};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDatetimeLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultScheduled(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(9, 0, 0, 0);
  return toDatetimeLocal(tomorrow);
}

// Real booking form: service, schedule, address and vehicle. Client
// validation mirrors the service rules for instant feedback; POST
// /api/bookings is the source of truth and its field errors land on
// the same inputs. Success swaps to the confirmation panel in place.
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

  const options: ServiceOption[] = useMemo(
    () =>
      services.map((service) => ({
        id: service.id,
        label: `${service.categoryName} — ${service.name} (${formatVnd(service.basePrice)})`,
      })),
    [services],
  );
  const minScheduled = useMemo(
    () => toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
    [],
  );
  const maxScheduled = useMemo(
    () => toDatetimeLocal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    [],
  );

  if (created) return <BookingSuccess booking={created} />;
  const pending = createBooking.isPending;

  function clearError(field: keyof BookingFieldErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      serviceId,
      scheduledAt,
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
        options={options}
        serviceId={serviceId}
        error={errors.serviceId}
        disabled={pending}
        onServiceId={(v) => {
          setServiceId(v);
          clearError("serviceId");
        }}
      />

      <BookingScheduleSection
        value={scheduledAt}
        min={minScheduled}
        max={maxScheduled}
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
