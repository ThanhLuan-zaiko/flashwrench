"use client";

import { useMemo } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import { BookingDetailsSection } from "./BookingDetailsSection";
import { BookingMapSection } from "./BookingMapSection";
import { BookingPrefillNotice } from "./BookingPrefillNotice";
import { BookingServiceGallery } from "./BookingServiceGallery";
import { BookingServiceSection } from "./BookingServiceSection";
import { BookingSubmitButton } from "./BookingSubmitButton";
import { BookingSuccess } from "./BookingSuccess";
import type { BookingPrefill } from "./booking-prefill";
import { MechanicSection } from "./MechanicSection";
import { useBookingForm } from "./useBookingForm";

type BookingFormProps = {
  preselected: ServiceItem | null;
  services: ServiceItem[];
  initialServiceId: string | null;
  prefill: BookingPrefill | null;
};

// Booking form layout: stacked on mobile, map column plus one column of
// fields on `lg`, and a third media-plus-mechanic column on `xl`. State
// and submit live in `useBookingForm`; success swaps to the
// confirmation panel in place.
export function BookingForm({
  preselected,
  services,
  initialServiceId,
  prefill,
}: BookingFormProps) {
  const {
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
    pending,
    minSlot,
    maxSlot,
    clearError,
    handleMapAddress,
    resetDetails,
    handleSubmit,
  } = useBookingForm({ initialServiceId, prefill });

  const activeService = useMemo(
    () => preselected ?? services.find((s) => s.id === serviceId) ?? null,
    [preselected, services, serviceId],
  );

  if (created) return <BookingSuccess booking={created} />;

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

      {prefilled && (
        <div className="lg:col-span-2 xl:col-span-3">
          <BookingPrefillNotice onReset={resetDetails} />
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
        {/* Remount on reset so the picker collapses back to the
            auto-dispatch default instead of staying open. */}
        <MechanicSection
          key={prefilled ? "saved" : "fresh"}
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
