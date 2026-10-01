import { BookingDateTimeInput, BookingField } from "./BookingFormFields";

type BookingScheduleSectionProps = {
  value: string;
  min: string;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

// Schedule step: one datetime input floored at the dispatch lead time
// (1 hour ahead). The slot is a wish staff confirm later, so there is
// no upper bound — matching the service validation.
export function BookingScheduleSection({
  value,
  min,
  error,
  disabled,
  onChange,
}: BookingScheduleSectionProps) {
  return (
    <BookingField
      id="scheduledAt"
      label="Khung giờ mong muốn"
      required
      error={error}
      hint="Đặt trước ít nhất 2 ngày. Shop sẽ liên hệ chốt lại giờ cụ thể."
    >
      <BookingDateTimeInput
        id="scheduledAt"
        value={value}
        min={min}
        onChange={onChange}
        error={error}
        disabled={disabled}
      />
    </BookingField>
  );
}
