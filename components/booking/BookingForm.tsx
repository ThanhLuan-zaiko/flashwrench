"use client";

import { useMemo, useState } from "react";
import { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";
import type { CreateBookingResponse } from "@/services/booking.api";
import { BookingDetailsSection } from "./BookingDetailsSection";
import { BookingGuestSection } from "./BookingGuestSection";
import { BookingPrefillNotice } from "./BookingPrefillNotice";
import { BookingPriceSummary } from "./BookingPriceSummary";
import { BookingReviewsSection } from "./BookingReviewsSection";
import { BookingServiceSection } from "./BookingServiceSection";
import { BookingStep } from "./BookingStep";
import { BookingWhereWhenStep } from "./BookingWhereWhenStep";
import { BookingWizardBar, BookingWizardProgress } from "./BookingWizardNav";
import type { BookingPrefill } from "./booking-prefill";
import { MechanicSection } from "./MechanicSection";
import { useBookingForm } from "./useBookingForm";
import { useBookingWizard } from "./useBookingWizard";

type BookingFormProps = {
  services: ServiceItem[];
  initialServiceIds: string[];
  prefill: BookingPrefill | null;
  guest: boolean;
  onCreated: (response: CreateBookingResponse) => void;
};

// Desktop: checkout-style layout mirroring /checkout, numbered step cards in one
// column, a summary aside in the other. The aside is the only item in
// its column, so pinning it can never slide it over another block —
// sticky grid items travel through the whole grid container, not just
// their row span. On mobile the steps stack and the summary closes the
// flow. State and submit live in `useBookingForm`. Guests get a contact
// step and skip the mechanic picker — the directory API is account-only,
// so guest bookings always auto-dispatch. Phones and tablets walk the same
// steps one at a time (useBookingWizard) with a pinned back/continue bar;
// the summary and confirm button appear on the last step.
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
    coords,
    mechanicId,
    setMechanicId,
    vehicle,
    setVehicle,
    walletId,
    setWalletId,
    voucherCode,
    setVoucherCode,
    errors,
    invalidAttempt,
    prefilled,
    pending,
    clearError,
    resetDetails,
    handleSubmit,
    formRef,
  } = form;
  const stepLabels = [
    "Dịch vụ",
    "Vị trí và thời gian",
    guest ? "Liên hệ" : "Chọn thợ",
    "Xe và xác nhận",
  ] as const;
  const wizard = useBookingWizard(stepLabels.length, formRef, invalidAttempt);
  // Off-step sections stay mounted (values and errors survive) but are
  // hidden below lg, where only the current step shows.
  const stepClass = (index: number) =>
    wizard.step === index ? "min-w-0" : "min-w-0 max-lg:hidden";
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
        className="grid scroll-mt-20 grid-cols-1 gap-4 max-lg:pb-24 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-6"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <BookingWizardProgress step={wizard.step} labels={stepLabels} />
          {prefilled && <BookingPrefillNotice onReset={resetDetails} />}
          <div data-booking-step={0} className={stepClass(0)}>
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
          </div>
          <div data-booking-step={1} className={stepClass(1)}>
            <BookingWhereWhenStep form={form} selection={selection} />
          </div>
          <div data-booking-step={2} className={stepClass(2)}>
            {guest ? (
              <BookingStep
                step={4}
                tour="booking-contact"
                title="Thông tin liên hệ"
                description="Cửa hàng và thợ dùng thông tin này để liên hệ về lịch hẹn."
              >
                <BookingGuestSection form={form} />
              </BookingStep>
            ) : (
              <BookingStep
                step={4}
                tour="booking-contact"
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
          <div data-booking-step={3} className={stepClass(3)}>
            <BookingDetailsSection
              vehicle={vehicle}
              errors={errors}
              disabled={pending}
              onVehicle={(field, value) => {
                setVehicle((previous) => ({ ...previous, [field]: value }));
                clearError(field);
              }}
            />
          </div>
        </div>
        <div className={wizard.isLast ? "min-w-0" : "min-w-0 max-lg:hidden"}>
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
        </div>
      </form>
      <div className={wizard.step === 0 ? "" : "max-lg:hidden"}>
        <BookingReviewsSection
          service={activeService}
          lat={coords?.lat ?? null}
          lng={coords?.lng ?? null}
        />
      </div>
      <BookingWizardBar
        step={wizard.step}
        labels={stepLabels}
        onPrev={wizard.prev}
        onNext={wizard.next}
      />
    </>
  );
}
