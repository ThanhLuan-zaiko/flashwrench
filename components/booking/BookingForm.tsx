"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import type { AddressValues } from "./BookingAddressSection";
import { BookingDetailsSection } from "./BookingDetailsSection";
import { BookingMapSection } from "./BookingMapSection";
import { BookingServiceGallery } from "./BookingServiceGallery";
import { BookingServiceSection } from "./BookingServiceSection";
import { BookingSubmitButton } from "./BookingSubmitButton";
import { BookingSuccess } from "./BookingSuccess";
import type { VehicleValues } from "./BookingVehicleSection";
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
  const activeService = useMemo(
    () => preselected ?? services.find((s) => s.id === serviceId) ?? null,
    [preselected, services, serviceId],
  );

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
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 lg:grid lg:grid-flow-dense lg:grid-cols-2 lg:gap-x-5 xl:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {errors.form && (
        <div className="lg:col-span-2 xl:col-span-3">
          <FormAlert message={errors.form} />
        </div>
      )}

      <div className="lg:col-start-2">
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
      </div>

      <div className="lg:col-start-2 xl:col-start-3">
        <BookingServiceGallery
          key={activeService?.id ?? "none"}
          service={activeService}
        />
      </div>

      <div className="lg:col-start-1 lg:row-span-5 lg:self-start lg:sticky lg:top-20 xl:row-span-3">
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
      </div>

      <div className="lg:col-start-2">
        <BookingDetailsSection
          scheduledAt={scheduledAt}
          min={minSlot}
          max={maxSlot}
          address={address}
          vehicle={vehicle}
          errors={errors}
          disabled={pending}
          onScheduledAt={(v) => {
            setScheduledAt(v);
            clearError("scheduledAt");
          }}
          onAddress={(field, v) => {
            setAddress((prev) => ({ ...prev, [field]: v }));
            clearError(field);
          }}
          onVehicle={(field, v) => {
            setVehicle((prev) => ({ ...prev, [field]: v }));
            clearError(field);
          }}
        />
      </div>

      <div className="lg:col-start-2 xl:col-start-3">
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
      </div>

      <div className="lg:col-start-2 xl:col-span-2">
        <BookingSubmitButton pending={pending} />
      </div>
    </form>
  );
}
