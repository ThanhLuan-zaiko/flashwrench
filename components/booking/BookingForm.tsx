"use client";

import { useMemo, useState } from "react";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import type { CreateBookingResponse } from "@/services/booking.api";
import { BookingDetailsSection } from "./BookingDetailsSection";
import { BookingGuestSection } from "./BookingGuestSection";
import { BookingLocationSection } from "./BookingLocationSection";
import { BookingPrefillNotice } from "./BookingPrefillNotice";
import { BookingPriceSummary } from "./BookingPriceSummary";
import { BookingReviewsSection } from "./BookingReviewsSection";
import { BookingServiceSection } from "./BookingServiceSection";
import { BookingStep } from "./BookingStep";
import type { BookingPrefill } from "./booking-prefill";
import { MechanicSection } from "./MechanicSection";
import { useBookingForm } from "./useBookingForm";

type BookingFormProps = {
  services: ServiceItem[];
  initialServiceIds: string[];
  prefill: BookingPrefill | null;
  guest: boolean;
  onCreated: (response: CreateBookingResponse) => void;
};

// Checkout-style layout mirroring /checkout: numbered step cards in one
// column, a summary aside in the other. The aside is the only item in
// its column, so pinning it can never slide it over another block —
// sticky grid items travel through the whole grid container, not just
// their row span. On mobile the steps stack and the summary closes the
// flow. State and submit live in `useBookingForm`. Guests get a contact
// step and skip the mechanic picker — the directory API is account-only,
// so guest bookings always auto-dispatch.
export function BookingForm({
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
    voucherCode,
    setVoucherCode,
    errors,
    prefilled,
    pending,
    minSlot,
    clearError,
    handleMapAddress,
    resetDetails,
    handleSubmit,
    formRef,
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
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        aria-label="Đặt lịch sửa xe"
        className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-6"
      >
        <div className="flex min-w-0 flex-col gap-4">
          {prefilled && <BookingPrefillNotice onReset={resetDetails} />}
          <BookingServiceSection
            services={services}
            serviceIds={serviceIds}
            selection={selection}
            activeService={activeService}
            error={errors.serviceIds ?? errors.serviceId}
            disabled={pending}
            onServiceIds={setServiceIds}
            onInspect={setInspectedServiceId}
          />
          <BookingLocationSection
            coords={coords}
            address={address}
            errors={errors}
            disabled={pending}
            onCoords={(point) => {
              setCoords(point);
              clearError("location");
            }}
            onMapAddress={handleMapAddress}
            onAddress={(field, value) => {
              setAddress((previous) => ({ ...previous, [field]: value }));
              clearError(field);
            }}
          />
          <BookingDetailsSection
            scheduledAt={scheduledAt}
            min={minSlot}
            vehicle={vehicle}
            errors={errors}
            disabled={pending}
            onScheduledAt={(value) => {
              setScheduledAt(value);
              clearError("scheduledAt");
            }}
            onVehicle={(field, value) => {
              setVehicle((previous) => ({ ...previous, [field]: value }));
              clearError(field);
            }}
          />
          {guest ? (
            <BookingStep
              step={4}
              title="Thông tin liên hệ"
              description="Cửa hàng và thợ dùng thông tin này để liên hệ về lịch hẹn."
            >
              <BookingGuestSection form={form} />
            </BookingStep>
          ) : (
            <BookingStep
              step={4}
              title="Thợ sửa xe"
              description="Thợ cần xác nhận toàn bộ hạng mục trong lịch hẹn. Thời gian làm việc được kiểm tra theo tổng thời lượng."
            >
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
            </BookingStep>
          )}
        </div>
        <BookingPriceSummary
          serviceIds={serviceIds}
          selection={selection}
          guest={guest}
          walletId={walletId}
          voucherCode={voucherCode}
          errors={errors}
          pending={pending}
          onVoucherCode={setVoucherCode}
          onWallet={(next) => {
            setWalletId(next);
            clearError("walletId");
          }}
        />
      </form>
      <BookingReviewsSection
        service={activeService}
        lat={coords?.lat ?? null}
        lng={coords?.lng ?? null}
      />
    </>
  );
}
