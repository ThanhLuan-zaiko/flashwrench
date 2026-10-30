import type { getBookingServiceSelection } from "@/lib/booking/booking-service-selection";
import { BookingLocationSection } from "./BookingLocationSection";
import { BookingScheduleSection } from "./BookingScheduleSection";
import {
  BookingRunningTotal,
  BookingSelectedCard,
} from "./BookingSelectedMini";
import { BookingStep } from "./BookingStep";
import type { useBookingForm } from "./useBookingForm";

type BookingWhereWhenStepProps = {
  form: ReturnType<typeof useBookingForm>;
  selection: ReturnType<typeof getBookingServiceSelection>;
};

// Wizard step "Vị trí và thời gian": where the vehicle is and when the
// mechanic should come. Phones also get a recap of the chosen services on
// top and the running subtotal below, like the reference design.
export function BookingWhereWhenStep({
  form,
  selection,
}: BookingWhereWhenStepProps) {
  const { errors, pending, clearError } = form;
  return (
    <div className="flex flex-col gap-6 sm:gap-4">
      <div className="lg:hidden">
        <BookingSelectedCard services={selection.services} />
      </div>
      <BookingLocationSection
        coords={form.coords}
        address={form.address}
        errors={errors}
        disabled={pending}
        onCoords={(point) => {
          form.setCoords(point);
          clearError("location");
        }}
        onMapAddress={form.handleMapAddress}
        onAddress={(field, value) => {
          form.setAddress((previous) => ({ ...previous, [field]: value }));
          clearError(field);
        }}
      />
      <BookingStep step={3} tour="booking-details" title="Khi nào thợ tới?">
        <BookingScheduleSection
          value={form.scheduledAt}
          min={form.minSlot}
          max={form.maxSlot}
          leadDays={form.leadDays}
          maxDays={form.maxDays}
          hoursLabel={form.hoursLabel}
          error={errors.scheduledAt}
          disabled={pending}
          onChange={(value) => {
            form.setScheduledAt(value);
            clearError("scheduledAt");
          }}
        />
      </BookingStep>
      <div className="lg:hidden">
        <BookingRunningTotal
          services={selection.services}
          subtotal={selection.subtotal}
        />
      </div>
    </div>
  );
}
