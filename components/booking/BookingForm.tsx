"use client";

import { useMemo, useState } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { WalletPicker } from "@/components/vouchers/WalletPicker";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import type { CreateBookingResponse } from "@/services/booking.api";
import { BookingDetailsSection } from "./BookingDetailsSection";
import { BookingGuestSection } from "./BookingGuestSection";
import { BookingMapSection } from "./BookingMapSection";
import { BookingPrefillNotice } from "./BookingPrefillNotice";
import { BookingReviewsSection } from "./BookingReviewsSection";
import { BookingServiceMedia } from "./BookingServiceMedia";
import { BookingServiceSection } from "./BookingServiceSection";
import { BookingSubmitButton } from "./BookingSubmitButton";
import type { BookingPrefill } from "./booking-prefill";
import { MechanicSection } from "./MechanicSection";
import { useBookingForm } from "./useBookingForm";

type BookingFormProps = {
  preselected: ServiceItem | null;
  services: ServiceItem[];
  initialServiceIds: string[];
  prefill: BookingPrefill | null;
  guest: boolean;
  onCreated: (response: CreateBookingResponse) => void;
};

// Booking form layout: stacked on mobile, map column plus one column of
// fields on `lg`, and a third media-plus-mechanic column on `xl`. State
// and submit live in `useBookingForm`. Guests get a contact block and
// skip the mechanic picker — the directory API is account-only, so
// guest bookings always auto-dispatch.
export function BookingForm({
  preselected,
  services,
  initialServiceIds,
  prefill,
  guest,
  onCreated,
}: BookingFormProps) {
  const form = useBookingForm({
    initialServiceIds,
    services,
    prefill,
    guest,
    onCreated,
  });
  const {
    serviceIds,
    setServiceIds,
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
    walletId,
    setWalletId,
    errors,
    prefilled,
    pending,
    minSlot,
    clearError,
    handleMapAddress,
    resetDetails,
    handleSubmit,
  } = form;
  const [inspectedServiceId, setInspectedServiceId] = useState(
    initialServiceIds[0] ?? "",
  );
  const selection = useMemo(
    () => getBookingServiceSelection(serviceIds, services),
    [serviceIds, services],
  );
  const activeService = useMemo(() => {
    const id = serviceIds.includes(inspectedServiceId)
      ? inspectedServiceId
      : serviceIds[0];
    return selection.services.find((service) => service.id === id) ?? null;
  }, [selection.services, serviceIds, inspectedServiceId]);

  return (
    <>
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
            serviceIds={serviceIds}
            error={errors.serviceIds ?? errors.serviceId}
            disabled={pending}
            onServiceIds={setServiceIds}
            onInspect={setInspectedServiceId}
          />
        </div>

        {/* Owns col 3 on xl and pins like the map: the row-span gives the
        sticky element tracks to travel through while scrolling. At lg the
        gallery shares col 2 with the fields, so it stays in normal flow. */}
        <BookingServiceMedia
          services={selection.services}
          service={activeService}
          onInspect={setInspectedServiceId}
        />
        {guest && <BookingGuestSection form={form} />}

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
            address={address}
            vehicle={vehicle}
            errors={errors}
            disabled={pending}
            onScheduledAt={(value) => {
              setScheduledAt(value);
              clearError("scheduledAt");
            }}
            onAddress={(field, value) => {
              setAddress((previous) => ({ ...previous, [field]: value }));
              clearError(field);
            }}
            onVehicle={(field, value) => {
              setVehicle((previous) => ({ ...previous, [field]: value }));
              clearError(field);
            }}
          />
        </div>
        {!guest && (
          <div className="flex flex-col gap-2 lg:col-start-2 xl:col-start-3">
            {/* Remount on reset so the picker collapses back to the
            auto-dispatch default instead of staying open. */}
            <MechanicSection
              key={prefilled ? "saved" : "fresh"}
              lat={coords?.lat ?? null}
              lng={coords?.lng ?? null}
              value={mechanicId}
              error={errors.mechanicId}
              disabled={pending}
              onChange={(value) => {
                setMechanicId(value);
                clearError("mechanicId");
              }}
            />
            <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Thợ cần xác nhận toàn bộ hạng mục trong lịch hẹn. Thời gian làm
              việc được kiểm tra theo tổng thời lượng.
            </p>
          </div>
        )}
        {!guest && (
          <div className="flex flex-col gap-4 lg:col-start-2">
            <WalletPicker
              kind="booking"
              subtotal={selection.subtotal}
              value={walletId}
              error={errors.walletId}
              disabled={
                pending || serviceIds.length === 0 || selection.issue !== null
              }
              showTotals
              onChange={(next) => {
                setWalletId(next);
                clearError("walletId");
              }}
            />
          </div>
        )}

        {/* xl:col-end-4 (longhand) instead of xl:col-span-2: the span-2
        shorthand resets grid-column-start set by lg:col-start-2, letting
        dense packing drop the button into an empty col-1 cell under the
        sticky map. start=2 + end=4 keeps it pinned to the right side. */}
        <div className="lg:col-start-2 xl:col-end-4">
          <BookingSubmitButton
            pending={pending}
            disabled={serviceIds.length === 0 || selection.issue !== null}
            serviceCount={serviceIds.length}
          />
        </div>
      </form>
      <BookingReviewsSection
        service={activeService}
        lat={coords?.lat ?? null}
        lng={coords?.lng ?? null}
      />
    </>
  );
}
